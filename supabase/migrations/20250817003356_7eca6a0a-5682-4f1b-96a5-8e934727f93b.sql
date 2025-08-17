
-- Fix the get_account_balances function to handle negative amounts correctly
-- This ensures expenses are always subtracted and revenues are always added,
-- regardless of the sign of the amount in the database
CREATE OR REPLACE FUNCTION public.get_account_balances(p_as_of_date date DEFAULT (now())::date)
 RETURNS TABLE(account_id uuid, current_balance numeric)
 LANGUAGE sql
AS $function$
  SELECT
    a.id AS account_id,
    COALESCE(ib.amount, 0)::numeric
    + COALESCE(
        SUM(
          CASE
            WHEN t.type = 'despesa' THEN -ABS(t.amount)
            WHEN t.type = 'receita' THEN ABS(t.amount)
            ELSE 0
          END
        ) FILTER (
          WHERE COALESCE(t.effective_date, t.event_date) >= COALESCE(ib.balance_date, DATE '1900-01-01')
            AND COALESCE(t.effective_date, t.event_date) <= p_as_of_date
            AND t.status = 'concluido'
        ),
        0
      )::numeric AS current_balance
  FROM public.accounts a
  LEFT JOIN public.account_initial_balances ib
    ON ib.account_id = a.id
    AND ib.user_id = a.user_id
  LEFT JOIN public.transactions t
    ON t.account_id = a.id
    AND t.user_id = a.user_id
  WHERE a.user_id = auth.uid()
  GROUP BY a.id, ib.amount, ib.balance_date;
$function$
