-- Fix get_account_balances function to properly return account balances
CREATE OR REPLACE FUNCTION public.get_account_balances(p_as_of_date date DEFAULT (now())::date)
 RETURNS TABLE(account_id uuid, current_balance numeric)
 LANGUAGE sql
 SECURITY DEFINER
AS $$
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
          WHERE t.event_date >= COALESCE(ib.balance_date, DATE '1900-01-01')
            AND t.event_date <= p_as_of_date
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
    AND a.is_active = true
  GROUP BY a.id, ib.amount, ib.balance_date
  ORDER BY a.created_at;
$$;