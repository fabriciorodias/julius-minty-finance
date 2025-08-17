
-- Adicionar suporte aos métodos de conciliação
DO $$
BEGIN
  -- 1) Criar enum para métodos de conciliação (idempotente)
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'reconciliation_method'
  ) THEN
    CREATE TYPE public.reconciliation_method AS ENUM ('manual', 'automacao', 'open_finance');
  END IF;

  -- 2) Adicionar coluna para método de conciliação (idempotente)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'accounts'
      AND column_name = 'last_reconciliation_method'
  ) THEN
    ALTER TABLE public.accounts
      ADD COLUMN last_reconciliation_method public.reconciliation_method NULL;
  END IF;

  -- 3) Backfill: marcar como 'manual' todas as contas já conciliadas
  UPDATE public.accounts
     SET last_reconciliation_method = 'manual'
   WHERE last_reconciled_at IS NOT NULL
     AND last_reconciliation_method IS NULL;
END $$;

-- Adicionar comentários para documentação
COMMENT ON TYPE public.reconciliation_method IS 'Método utilizado na última conciliação da conta.';
COMMENT ON COLUMN public.accounts.last_reconciliation_method IS 'Forma utilizada na última conciliação (manual, automação ou open finance).';
