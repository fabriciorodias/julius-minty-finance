-- Fix security issues for new functions
CREATE OR REPLACE FUNCTION public.calculate_next_due_date(
  p_recurrence_pattern TEXT,
  p_current_date DATE,
  p_day_of_month INTEGER DEFAULT 1
) RETURNS DATE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix search path for analytics function
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
SECURITY DEFINER
SET search_path = public
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