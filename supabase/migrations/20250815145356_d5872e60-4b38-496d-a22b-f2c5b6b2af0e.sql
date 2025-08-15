
-- 1) Tabela de orçamentos mensais por categoria
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Importante: não criar FK para auth.users (conforme boas práticas),
  -- usamos RLS para vincular ao usuário autenticado
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  budgeted_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT budgets_unique_user_category_month UNIQUE (user_id, category_id, month),
  -- Normaliza para o 1º dia do mês (ex.: 2025-08-01)
  CONSTRAINT budgets_month_is_first_day CHECK (date_trunc('month', month)::date = month),
  -- Evita valores negativos por engano
  CONSTRAINT budgets_amount_non_negative CHECK (budgeted_amount >= 0)
);

-- 2) Índices úteis para consultas por usuário/mês e por categoria/mês
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets (user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_category_month ON public.budgets (category_id, month);

-- 3) Trigger para updated_at
CREATE OR REPLACE FUNCTION public.budgets_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_budgets_set_updated_at ON public.budgets;
CREATE TRIGGER trg_budgets_set_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.budgets_set_updated_at();

-- 4) RLS: habilitar e criar políticas
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário vê apenas seus registros
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
CREATE POLICY "Users can view their own budgets"
  ON public.budgets
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: usuário só insere para si e com categoria que também pertence a ele
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
CREATE POLICY "Users can insert their own budgets"
  ON public.budgets
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = category_id AND c.user_id = auth.uid()
    )
  );

-- UPDATE: usuário só atualiza seus registros e mantém categoria pertencente a ele
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
CREATE POLICY "Users can update their own budgets"
  ON public.budgets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = category_id AND c.user_id = auth.uid()
    )
  );

-- DELETE: usuário só deleta seus registros
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;
CREATE POLICY "Users can delete their own budgets"
  ON public.budgets
  FOR DELETE
  USING (auth.uid() = user_id);
