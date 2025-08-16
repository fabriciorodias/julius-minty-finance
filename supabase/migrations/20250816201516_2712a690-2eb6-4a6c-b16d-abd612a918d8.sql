
-- 1) Criar o enum do tipo de conta, se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'account_type' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.account_type AS ENUM ('on_budget', 'credit');
  END IF;
END$$;

-- 2) Adicionar coluna "type" na tabela accounts (padrão: on_budget)
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS type public.account_type NOT NULL DEFAULT 'on_budget';

-- 3) Adicionar coluna "credit_limit" (nula para contas on-budget)
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS credit_limit numeric;

-- Observações:
-- - Mantemos a coluna "is_active" já existente.
-- - Não adicionamos coluna "balance": o saldo continua calculado via a função RPC get_account_balances.
-- - RLS atual em accounts já cobre as novas colunas (nenhuma mudança necessária).
