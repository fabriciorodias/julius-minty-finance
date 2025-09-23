-- Create recurring_transactions table
CREATE TABLE public.recurring_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC,
  expected_amount NUMERIC NOT NULL DEFAULT 0,
  variance_tolerance NUMERIC DEFAULT 10,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  category_id UUID,
  account_id UUID,
  counterparty_id UUID,
  recurrence_pattern TEXT NOT NULL DEFAULT 'monthly' CHECK (recurrence_pattern IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  day_of_month INTEGER DEFAULT 1,
  next_due_date DATE NOT NULL,
  last_payment_date DATE,
  notification_days INTEGER DEFAULT 3,
  auto_categorize BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own recurring_transactions" 
ON public.recurring_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring_transactions" 
ON public.recurring_transactions 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (category_id IS NULL OR EXISTS (
    SELECT 1 FROM categories c WHERE c.id = category_id AND c.user_id = auth.uid()
  ))
  AND (account_id IS NULL OR EXISTS (
    SELECT 1 FROM accounts a WHERE a.id = account_id AND a.user_id = auth.uid()
  ))
  AND (counterparty_id IS NULL OR EXISTS (
    SELECT 1 FROM counterparties cp WHERE cp.id = counterparty_id AND cp.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can update their own recurring_transactions" 
ON public.recurring_transactions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND (category_id IS NULL OR EXISTS (
    SELECT 1 FROM categories c WHERE c.id = category_id AND c.user_id = auth.uid()
  ))
  AND (account_id IS NULL OR EXISTS (
    SELECT 1 FROM accounts a WHERE a.id = account_id AND a.user_id = auth.uid()
  ))
  AND (counterparty_id IS NULL OR EXISTS (
    SELECT 1 FROM counterparties cp WHERE cp.id = counterparty_id AND cp.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can delete their own recurring_transactions" 
ON public.recurring_transactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE TRIGGER update_recurring_transactions_updated_at
BEFORE UPDATE ON public.recurring_transactions
FOR EACH ROW
EXECUTE FUNCTION public.budgets_set_updated_at();

-- Create function to calculate next due date
CREATE OR REPLACE FUNCTION public.calculate_next_due_date(
  p_recurrence_pattern TEXT,
  p_current_date DATE,
  p_day_of_month INTEGER DEFAULT 1
) RETURNS DATE
LANGUAGE plpgsql
AS $function$
BEGIN
  CASE p_recurrence_pattern
    WHEN 'weekly' THEN
      RETURN p_current_date + INTERVAL '7 days';
    WHEN 'monthly' THEN
      RETURN DATE_TRUNC('month', p_current_date + INTERVAL '1 month') + (p_day_of_month - 1) * INTERVAL '1 day';
    WHEN 'quarterly' THEN
      RETURN DATE_TRUNC('month', p_current_date + INTERVAL '3 months') + (p_day_of_month - 1) * INTERVAL '1 day';
    WHEN 'yearly' THEN
      RETURN DATE_TRUNC('month', p_current_date + INTERVAL '1 year') + (p_day_of_month - 1) * INTERVAL '1 day';
    ELSE
      RETURN p_current_date + INTERVAL '1 month';
  END CASE;
END;
$function$;

-- Create function to get recurring transactions with analytics
CREATE OR REPLACE FUNCTION public.get_recurring_transactions_analytics(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  template_name TEXT,
  description TEXT,
  expected_amount NUMERIC,
  last_amount NUMERIC,
  variance_percentage NUMERIC,
  next_due_date DATE,
  days_until_due INTEGER,
  status TEXT,
  avg_last_3_months NUMERIC,
  category_name TEXT,
  account_name TEXT,
  counterparty_name TEXT
)
LANGUAGE sql
AS $function$
  SELECT 
    rt.id,
    rt.template_name,
    rt.description,
    rt.expected_amount,
    COALESCE(latest_t.amount, 0) as last_amount,
    CASE 
      WHEN rt.expected_amount > 0 AND latest_t.amount IS NOT NULL
      THEN (ABS(latest_t.amount - rt.expected_amount) / rt.expected_amount * 100)
      ELSE 0
    END as variance_percentage,
    rt.next_due_date,
    (rt.next_due_date - CURRENT_DATE) as days_until_due,
    rt.status,
    COALESCE(avg_3m.avg_amount, 0) as avg_last_3_months,
    c.name as category_name,
    a.name as account_name,
    cp.name as counterparty_name
  FROM public.recurring_transactions rt
  LEFT JOIN public.categories c ON c.id = rt.category_id
  LEFT JOIN public.accounts a ON a.id = rt.account_id
  LEFT JOIN public.counterparties cp ON cp.id = rt.counterparty_id
  LEFT JOIN LATERAL (
    SELECT t.amount
    FROM public.transactions t
    WHERE t.user_id = rt.user_id
      AND (t.description ILIKE '%' || rt.template_name || '%' 
           OR t.counterparty_id = rt.counterparty_id)
      AND t.type = rt.type
    ORDER BY t.event_date DESC
    LIMIT 1
  ) latest_t ON true
  LEFT JOIN LATERAL (
    SELECT AVG(t.amount) as avg_amount
    FROM public.transactions t
    WHERE t.user_id = rt.user_id
      AND (t.description ILIKE '%' || rt.template_name || '%' 
           OR t.counterparty_id = rt.counterparty_id)
      AND t.type = rt.type
      AND t.event_date >= CURRENT_DATE - INTERVAL '3 months'
  ) avg_3m ON true
  WHERE rt.user_id = p_user_id
  ORDER BY rt.next_due_date ASC;
$function$;