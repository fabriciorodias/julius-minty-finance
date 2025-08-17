
-- 1) Add last_reconciled_at to accounts. Nullable to avoid breaking existing rows.
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS last_reconciled_at TIMESTAMPTZ NULL;

-- Optional: document the column
COMMENT ON COLUMN public.accounts.last_reconciled_at IS 'Data/hora da última conciliação manual ou automática da conta.';
