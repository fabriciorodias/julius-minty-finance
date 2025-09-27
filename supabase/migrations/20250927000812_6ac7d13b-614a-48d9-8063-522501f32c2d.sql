-- Dropar e recriar a função get_recurring_transactions_analytics com tipo explícito
DROP FUNCTION public.get_recurring_transactions_analytics(uuid);

CREATE OR REPLACE FUNCTION public.get_recurring_transactions_analytics(p_user_id uuid)
 RETURNS TABLE(
   id uuid, 
   template_name text, 
   description text, 
   expected_amount numeric, 
   type text,
   last_amount numeric, 
   variance_percentage numeric, 
   next_due_date date, 
   days_until_due integer, 
   status text, 
   avg_last_3_months numeric, 
   category_name text, 
   account_name text, 
   counterparty_name text
 )
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    rt.id,
    rt.template_name,
    rt.description,
    rt.expected_amount,
    rt.type, -- Garantir que o tipo está sendo retornado
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
    COALESCE(c.name, 'Sem categoria') as category_name,
    COALESCE(a.name, 'Sem conta') as account_name,
    COALESCE(cp.name, 'Sem contrapartida') as counterparty_name
  FROM public.recurring_transactions rt
  LEFT JOIN public.categories c ON c.id = rt.category_id AND c.user_id = rt.user_id
  LEFT JOIN public.accounts a ON a.id = rt.account_id AND a.user_id = rt.user_id
  LEFT JOIN public.counterparties cp ON cp.id = rt.counterparty_id AND cp.user_id = rt.user_id
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
$function$