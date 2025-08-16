
-- RPC: Consolida Planejado x Realizado por subcategoria para um mês
-- Observações:
-- - Usa auth.uid() para garantir que sempre agregue apenas dados do usuário autenticado
-- - Para categorias tipo 'despesa', soma transações de 'despesa'
--   Para categorias tipo 'receita', soma transações de 'receita'
-- - Considera o intervalo [mês, mês+1) com base em event_date
-- - Traz linhas presentes apenas em budgets, apenas em transações ou em ambos (full outer join)

CREATE OR REPLACE FUNCTION public.get_monthly_budget_actuals(p_month date)
RETURNS TABLE (
  category_id uuid,
  category_type text,
  budgeted_amount numeric,
  actual_amount numeric
)
LANGUAGE sql
SECURITY INVOKER
AS $$
  WITH mr AS (
    SELECT
      p_month::date AS start_date,
      (p_month + INTERVAL '1 month')::date AS end_date
  ),
  b AS (
    SELECT
      b.category_id,
      c.type AS category_type,
      SUM(b.budgeted_amount)::numeric AS budgeted_amount
    FROM budgets b
    JOIN categories c
      ON c.id = b.category_id
     AND c.user_id = b.user_id
    JOIN mr ON b.month = mr.start_date
    WHERE b.user_id = auth.uid()
    GROUP BY b.category_id, c.type
  ),
  a AS (
    SELECT
      t.category_id,
      c.type AS category_type,
      SUM(t.amount)::numeric AS actual_amount
    FROM transactions t
    JOIN categories c
      ON c.id = t.category_id
     AND c.user_id = t.user_id
    JOIN mr ON t.event_date >= mr.start_date AND t.event_date < mr.end_date
    WHERE t.user_id = auth.uid()
      AND t.category_id IS NOT NULL
      AND t.type = c.type
    GROUP BY t.category_id, c.type
  )
  SELECT
    COALESCE(b.category_id, a.category_id) AS category_id,
    COALESCE(b.category_type, a.category_type) AS category_type,
    COALESCE(b.budgeted_amount, 0)::numeric AS budgeted_amount,
    COALESCE(a.actual_amount, 0)::numeric AS actual_amount
  FROM b
  FULL OUTER JOIN a
    ON a.category_id = b.category_id;
$$;

-- Índices úteis para performance (idempotentes):
CREATE INDEX IF NOT EXISTS idx_transactions_user_category_event
  ON public.transactions (user_id, category_id, event_date);

CREATE INDEX IF NOT EXISTS idx_budgets_user_category_month
  ON public.budgets (user_id, category_id, month);
