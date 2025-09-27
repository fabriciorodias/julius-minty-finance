-- Correção da função get_recurring_transactions_analytics para melhorar a precisão do "último valor"
-- A função atual pega qualquer transação com mesma contrapartida/categoria, o que pode ser de outros lançamentos recorrentes
-- Vamos melhorar o matching usando múltiplos critérios e uma janela temporal mais restritiva

CREATE OR REPLACE FUNCTION public.get_recurring_transactions_analytics(p_user_id uuid)
 RETURNS TABLE(id uuid, template_name text, description text, expected_amount numeric, type text, last_amount numeric, variance_percentage numeric, next_due_date date, days_until_due integer, status text, avg_last_3_months numeric, category_name text, account_name text, counterparty_name text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    rt.id,
    rt.template_name,
    rt.description,
    rt.expected_amount,
    rt.type,
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
      AND t.type = rt.type
      AND (rt.counterparty_id IS NULL OR t.counterparty_id = rt.counterparty_id)
      AND (rt.category_id IS NULL OR t.category_id = rt.category_id)
      AND (rt.account_id IS NULL OR t.account_id = rt.account_id)
      -- Melhor matching: considerar também proximidade do valor esperado
      AND (rt.expected_amount = 0 OR ABS(t.amount - rt.expected_amount) <= rt.expected_amount * 0.5)
      -- Janela temporal: buscar apenas desde o último pagamento ou últimos 6 meses
      AND t.event_date >= COALESCE(rt.last_payment_date, CURRENT_DATE - INTERVAL '6 months')
      AND t.event_date <= CURRENT_DATE
      -- Evitar transferências internas
      AND t.transfer_id IS NULL
    ORDER BY t.event_date DESC, 
             -- Priorizar transações com valor mais próximo do esperado
             ABS(t.amount - rt.expected_amount) ASC
    LIMIT 1
  ) latest_t ON true
  LEFT JOIN LATERAL (
    SELECT AVG(t.amount) as avg_amount
    FROM public.transactions t
    WHERE t.user_id = rt.user_id
      AND t.type = rt.type
      AND (rt.counterparty_id IS NULL OR t.counterparty_id = rt.counterparty_id)
      AND (rt.category_id IS NULL OR t.category_id = rt.category_id)
      AND (rt.account_id IS NULL OR t.account_id = rt.account_id)
      AND t.event_date >= CURRENT_DATE - INTERVAL '3 months'
      AND t.transfer_id IS NULL
  ) avg_3m ON true
  WHERE rt.user_id = p_user_id
  ORDER BY rt.next_due_date ASC;
$function$