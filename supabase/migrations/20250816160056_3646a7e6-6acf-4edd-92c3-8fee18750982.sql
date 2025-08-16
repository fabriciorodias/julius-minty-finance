
-- 1) Tabela de saldo inicial por conta
CREATE TABLE IF NOT EXISTS public.account_initial_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  balance_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT account_initial_balances_user_account_unique UNIQUE (user_id, account_id)
);

-- Habilitar RLS
ALTER TABLE public.account_initial_balances ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own account initial balances"
  ON public.account_initial_balances
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own account initial balances"
  ON public.account_initial_balances
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = account_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own account initial balances"
  ON public.account_initial_balances
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = account_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own account initial balances"
  ON public.account_initial_balances
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.account_initial_balances_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_account_initial_balances_set_updated_at ON public.account_initial_balances;

CREATE TRIGGER trg_account_initial_balances_set_updated_at
BEFORE UPDATE ON public.account_initial_balances
FOR EACH ROW
EXECUTE FUNCTION public.account_initial_balances_set_updated_at();

-- 2) Função para obter o saldo atual por conta
-- Regra de cálculo:
-- saldo_atual = saldo_inicial
--   + SUM( (tipo = 'receita' ? +valor : -valor) )
--     filtrando lançamentos status='concluido'
--     com data = COALESCE(effective_date, event_date)
--     no intervalo [balance_date .. p_as_of_date]
CREATE OR REPLACE FUNCTION public.get_account_balances(p_as_of_date date DEFAULT (now()::date))
RETURNS TABLE(account_id uuid, current_balance numeric)
LANGUAGE sql
AS $function$
  SELECT
    a.id AS account_id,
    COALESCE(ib.amount, 0)::numeric
    + COALESCE(
        SUM(
          CASE
            WHEN t.type = 'despesa' THEN -t.amount
            ELSE t.amount
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
$function$;
