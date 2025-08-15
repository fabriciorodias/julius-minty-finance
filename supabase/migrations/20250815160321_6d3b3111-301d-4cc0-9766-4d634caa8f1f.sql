
-- Tornar o campo effective_date nullable na tabela transactions
ALTER TABLE public.transactions ALTER COLUMN effective_date DROP NOT NULL;
