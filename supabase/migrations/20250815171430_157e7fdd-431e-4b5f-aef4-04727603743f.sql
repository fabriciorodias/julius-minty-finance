
-- 1) Tabela principal: plans
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('poupanca','divida')),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  start_date date NOT NULL,
  end_date date NOT NULL,
  image_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plans_date_range CHECK (end_date >= start_date)
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON public.plans (user_id);
CREATE INDEX IF NOT EXISTS idx_plans_type ON public.plans (type);

-- Habilita RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Policies (CRUD do próprio usuário)
DROP POLICY IF EXISTS "Users can view their own plans" ON public.plans;
CREATE POLICY "Users can view their own plans"
  ON public.plans FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own plans" ON public.plans;
CREATE POLICY "Users can insert their own plans"
  ON public.plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own plans" ON public.plans;
CREATE POLICY "Users can update their own plans"
  ON public.plans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own plans" ON public.plans;
CREATE POLICY "Users can delete their own plans"
  ON public.plans FOR DELETE
  USING (auth.uid() = user_id);

-- Usa função já existente para updated_at (budgets_set_updated_at)
DROP TRIGGER IF EXISTS plans_set_updated_at ON public.plans;
CREATE TRIGGER plans_set_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.budgets_set_updated_at();



-- 2) Parcelas mensais do plano: plan_installments
CREATE TABLE IF NOT EXISTS public.plan_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  due_date date NOT NULL, -- mês/ano de referência
  planned_amount numeric NOT NULL CHECK (planned_amount >= 0),
  settled_amount numeric NOT NULL DEFAULT 0 CHECK (settled_amount >= 0),
  settled_date date,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','quitado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plan_installments_unique_month UNIQUE (plan_id, due_date)
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_plan_installments_user_id ON public.plan_installments (user_id);
CREATE INDEX IF NOT EXISTS idx_plan_installments_plan_id ON public.plan_installments (plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_installments_user_status ON public.plan_installments (user_id, status);
CREATE INDEX IF NOT EXISTS idx_plan_installments_due_date ON public.plan_installments (due_date);

-- Habilita RLS
ALTER TABLE public.plan_installments ENABLE ROW LEVEL SECURITY;

-- Policies (garantem vínculo com o plano do usuário)
DROP POLICY IF EXISTS "Users can view their own plan_installments" ON public.plan_installments;
CREATE POLICY "Users can view their own plan_installments"
  ON public.plan_installments FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_installments.plan_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own plan_installments" ON public.plan_installments;
CREATE POLICY "Users can insert their own plan_installments"
  ON public.plan_installments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_installments.plan_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own plan_installments" ON public.plan_installments;
CREATE POLICY "Users can update their own plan_installments"
  ON public.plan_installments FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_installments.plan_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_installments.plan_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own plan_installments" ON public.plan_installments;
CREATE POLICY "Users can delete their own plan_installments"
  ON public.plan_installments FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_installments.plan_id
        AND p.user_id = auth.uid()
    )
  );

-- Trigger updated_at
DROP TRIGGER IF EXISTS plan_installments_set_updated_at ON public.plan_installments;
CREATE TRIGGER plan_installments_set_updated_at
BEFORE UPDATE ON public.plan_installments
FOR EACH ROW EXECUTE FUNCTION public.budgets_set_updated_at();



-- 3) Retiradas de saldo (apenas para 'poupanca'): plan_withdrawals
CREATE TABLE IF NOT EXISTS public.plan_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  withdrawal_date date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_plan_withdrawals_user_id ON public.plan_withdrawals (user_id);
CREATE INDEX IF NOT EXISTS idx_plan_withdrawals_plan_id ON public.plan_withdrawals (plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_withdrawals_date ON public.plan_withdrawals (withdrawal_date);

-- Habilita RLS
ALTER TABLE public.plan_withdrawals ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own plan_withdrawals" ON public.plan_withdrawals;
CREATE POLICY "Users can view their own plan_withdrawals"
  ON public.plan_withdrawals FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_withdrawals.plan_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own plan_withdrawals" ON public.plan_withdrawals;
CREATE POLICY "Users can insert their own plan_withdrawals"
  ON public.plan_withdrawals FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_withdrawals.plan_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own plan_withdrawals" ON public.plan_withdrawals;
CREATE POLICY "Users can update their own plan_withdrawals"
  ON public.plan_withdrawals FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_withdrawals.plan_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_withdrawals.plan_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own plan_withdrawals" ON public.plan_withdrawals;
CREATE POLICY "Users can delete their own plan_withdrawals"
  ON public.plan_withdrawals FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = plan_withdrawals.plan_id
        AND p.user_id = auth.uid()
    )
  );



-- 4) Bucket para imagens de planos (público para leitura)
-- Cria bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('plan-images', 'plan-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies de leitura pública
DROP POLICY IF EXISTS "Public can view plan images" ON storage.objects;
CREATE POLICY "Public can view plan images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plan-images');

-- Policies para o dono gerenciar seus arquivos (armazenados em {user_id}/...)
DROP POLICY IF EXISTS "Users can upload their own plan images" ON storage.objects;
CREATE POLICY "Users can upload their own plan images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'plan-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own plan images" ON storage.objects;
CREATE POLICY "Users can update their own plan images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'plan-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'plan-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own plan images" ON storage.objects;
CREATE POLICY "Users can delete their own plan images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'plan-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
