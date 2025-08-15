
-- ============================
-- Módulo 6: Investimentos
-- ============================

-- 1) Tabela principal: investments
CREATE TABLE IF NOT EXISTS public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('renda_fixa','renda_variavel','outro')),
  issuer text,
  due_date date,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','liquidado')),
  display_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments (user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON public.investments (status);
CREATE INDEX IF NOT EXISTS idx_investments_type ON public.investments (type);
CREATE INDEX IF NOT EXISTS idx_investments_display_order ON public.investments (user_id, display_order);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;
CREATE POLICY "Users can view their own investments"
  ON public.investments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own investments" ON public.investments;
CREATE POLICY "Users can insert their own investments"
  ON public.investments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      institution_id IS NULL OR EXISTS (
        SELECT 1 FROM public.institutions i
        WHERE i.id = investments.institution_id
          AND i.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own investments" ON public.investments;
CREATE POLICY "Users can update their own investments"
  ON public.investments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      institution_id IS NULL OR EXISTS (
        SELECT 1 FROM public.institutions i
        WHERE i.id = investments.institution_id
          AND i.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete their own investments" ON public.investments;
CREATE POLICY "Users can delete their own investments"
  ON public.investments FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS investments_set_updated_at ON public.investments;
CREATE TRIGGER investments_set_updated_at
BEFORE UPDATE ON public.investments
FOR EACH ROW EXECUTE FUNCTION public.budgets_set_updated_at();


-- 2) Movimentações: investment_transactions
CREATE TABLE IF NOT EXISTS public.investment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id uuid NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('aporte','resgate')),
  amount numeric NOT NULL CHECK (amount > 0),
  transaction_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invest_tx_user ON public.investment_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_invest_tx_investment ON public.investment_transactions (investment_id);
CREATE INDEX IF NOT EXISTS idx_invest_tx_date ON public.investment_transactions (transaction_date);

ALTER TABLE public.investment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own investment_transactions" ON public.investment_transactions;
CREATE POLICY "Users can view their own investment_transactions"
  ON public.investment_transactions FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investments inv
      WHERE inv.id = investment_transactions.investment_id
        AND inv.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own investment_transactions" ON public.investment_transactions;
CREATE POLICY "Users can insert their own investment_transactions"
  ON public.investment_transactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investments inv
      WHERE inv.id = investment_transactions.investment_id
        AND inv.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own investment_transactions" ON public.investment_transactions;
CREATE POLICY "Users can update their own investment_transactions"
  ON public.investment_transactions FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investments inv
      WHERE inv.id = investment_transactions.investment_id
        AND inv.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investments inv
      WHERE inv.id = investment_transactions.investment_id
        AND inv.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own investment_transactions" ON public.investment_transactions;
CREATE POLICY "Users can delete their own investment_transactions"
  ON public.investment_transactions FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investments inv
      WHERE inv.id = investment_transactions.investment_id
        AND inv.user_id = auth.uid()
    )
  );


-- 3) Saldos mensais: investment_balances
CREATE TABLE IF NOT EXISTS public.investment_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id uuid NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  month date NOT NULL,
  balance numeric NOT NULL CHECK (balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT investment_balances_unique_month UNIQUE (investment_id, month),
  CONSTRAINT investment_balances_month_is_first_day CHECK (date_trunc('month', month) = month)
);

CREATE INDEX IF NOT EXISTS idx_invest_bal_user ON public.investment_balances (user_id);
CREATE INDEX IF NOT EXISTS idx_invest_bal_investment ON public.investment_balances (investment_id);
CREATE INDEX IF NOT EXISTS idx_invest_bal_month ON public.investment_balances (month);

ALTER TABLE public.investment_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own investment_balances" ON public.investment_balances;
CREATE POLICY "Users can view their own investment_balances"
  ON public.investment_balances FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investments inv
      WHERE inv.id = investment_balances.investment_id
        AND inv.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own investment_balances" ON public.investment_balances;
CREATE POLICY "Users can insert their own investment_balances"
  ON public.investment_balances FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investments inv
      WHERE inv.id = investment_balances.investment_id
        AND inv.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own investment_balances" ON public.investment_balances;
CREATE POLICY "Users can update their own investment_balances"
  ON public.investment_balances FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investments inv
      WHERE inv.id = investment_balances.investment_id
        AND inv.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investments inv
      WHERE inv.id = investment_balances.investment_id
        AND inv.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own investment_balances" ON public.investment_balances;
CREATE POLICY "Users can delete their own investment_balances"
  ON public.investment_balances FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.investments inv
      WHERE inv.id = investment_balances.investment_id
        AND inv.user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS investment_balances_set_updated_at ON public.investment_balances;
CREATE TRIGGER investment_balances_set_updated_at
BEFORE UPDATE ON public.investment_balances
FOR EACH ROW EXECUTE FUNCTION public.budgets_set_updated_at();


-- 4) Perfil: custo de vida mensal para KPI de Independência Financeira
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_cost_of_living numeric;


-- 5) Indicadores de Mercado (público para leitura, service_role para escrita)
CREATE TABLE IF NOT EXISTS public.market_indicators (
  indicator_date date PRIMARY KEY,
  selic numeric,
  cdi numeric,
  ipca numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_indicators ENABLE ROW LEVEL SECURITY;

-- todos podem ler (útil mesmo se usuário não estiver logado)
DROP POLICY IF EXISTS "Anyone can view market indicators" ON public.market_indicators;
CREATE POLICY "Anyone can view market indicators"
  ON public.market_indicators FOR SELECT
  USING (true);

-- somente service_role pode inserir/atualizar/excluir (edge function)
DROP POLICY IF EXISTS "Service role can insert market indicators" ON public.market_indicators;
CREATE POLICY "Service role can insert market indicators"
  ON public.market_indicators FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update market indicators" ON public.market_indicators;
CREATE POLICY "Service role can update market indicators"
  ON public.market_indicators FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can delete market indicators" ON public.market_indicators;
CREATE POLICY "Service role can delete market indicators"
  ON public.market_indicators FOR DELETE
  USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS market_indicators_set_updated_at ON public.market_indicators;
CREATE TRIGGER market_indicators_set_updated_at
BEFORE UPDATE ON public.market_indicators
FOR EACH ROW EXECUTE FUNCTION public.budgets_set_updated_at();
