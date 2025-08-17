
-- 1) Nova tabela de Contrapartes (Favorecido/Devedor)
CREATE TABLE public.counterparties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  document text NULL,
  email text NULL,
  phone text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.counterparties ENABLE ROW LEVEL SECURITY;

-- Restrições e índices úteis
CREATE UNIQUE INDEX counterparties_user_name_key ON public.counterparties(user_id, name);

-- Políticas RLS (restritas ao dono)
CREATE POLICY "Users can view their own counterparties"
  ON public.counterparties
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own counterparties"
  ON public.counterparties
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own counterparties"
  ON public.counterparties
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own counterparties"
  ON public.counterparties
  FOR DELETE
  USING (auth.uid() = user_id);

-- Gatilhos: updated_at e validação do nome
CREATE OR REPLACE FUNCTION public.counterparties_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.counterparties_validate_name()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.name IS NULL OR length(btrim(NEW.name)) = 0 THEN
    RAISE EXCEPTION 'Counterparty name cannot be empty';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER counterparties_set_updated_at
BEFORE UPDATE ON public.counterparties
FOR EACH ROW
EXECUTE FUNCTION public.counterparties_set_updated_at();

CREATE TRIGGER counterparties_validate_name
BEFORE INSERT OR UPDATE ON public.counterparties
FOR EACH ROW
EXECUTE FUNCTION public.counterparties_validate_name();

-- 2) Alterações na tabela de transações
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS counterparty_id uuid NULL,
  ADD COLUMN IF NOT EXISTS is_reviewed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes text NULL,
  ADD COLUMN IF NOT EXISTS plan_id uuid NULL;

-- FKs (nulas por padrão)
ALTER TABLE public.transactions
  ADD CONSTRAINT IF NOT EXISTS transactions_counterparty_id_fkey
  FOREIGN KEY (counterparty_id) REFERENCES public.counterparties(id) ON DELETE SET NULL;

ALTER TABLE public.transactions
  ADD CONSTRAINT IF NOT EXISTS transactions_plan_id_fkey
  FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE SET NULL;

-- Índices para filtragem
CREATE INDEX IF NOT EXISTS idx_transactions_counterparty_id ON public.transactions(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_transactions_is_reviewed ON public.transactions(is_reviewed);

-- 3) Atualização das RLS policies de transações para checar novas FKs
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND ((account_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = transactions.account_id AND a.user_id = auth.uid()
    ))
    AND ((credit_card_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.credit_cards cc
      WHERE cc.id = transactions.credit_card_id AND cc.user_id = auth.uid()
    ))
    AND ((category_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = transactions.category_id AND c.user_id = auth.uid()
    ))
    AND ((counterparty_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.counterparties cp
      WHERE cp.id = transactions.counterparty_id AND cp.user_id = auth.uid()
    ))
    AND ((plan_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = transactions.plan_id AND p.user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;

CREATE POLICY "Users can update their own transactions"
  ON public.transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND ((account_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = transactions.account_id AND a.user_id = auth.uid()
    ))
    AND ((credit_card_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.credit_cards cc
      WHERE cc.id = transactions.credit_card_id AND cc.user_id = auth.uid()
    ))
    AND ((category_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.categories c
      WHERE c.id = transactions.category_id AND c.user_id = auth.uid()
    ))
    AND ((counterparty_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.counterparties cp
      WHERE cp.id = transactions.counterparty_id AND cp.user_id = auth.uid()
    ))
    AND ((plan_id IS NULL) OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = transactions.plan_id AND p.user_id = auth.uid()
    ))
  );
