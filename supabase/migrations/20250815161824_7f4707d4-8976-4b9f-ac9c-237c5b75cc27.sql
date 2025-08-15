
BEGIN;

-- 1) Adicionar as FKs na tabela transactions (opcionais, com ON DELETE SET NULL)
ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES public.categories(id)
    ON DELETE SET NULL
    NOT VALID,
  ADD CONSTRAINT transactions_account_id_fkey
    FOREIGN KEY (account_id) REFERENCES public.accounts(id)
    ON DELETE SET NULL
    NOT VALID,
  ADD CONSTRAINT transactions_credit_card_id_fkey
    FOREIGN KEY (credit_card_id) REFERENCES public.credit_cards(id)
    ON DELETE SET NULL
    NOT VALID;

-- 2) Índices para performance (opcional porém recomendado)
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_credit_card_id ON public.transactions(credit_card_id);

-- 3) Validar as constraints (não falha inserts futuros; aqui checa dados existentes)
ALTER TABLE public.transactions VALIDATE CONSTRAINT transactions_category_id_fkey;
ALTER TABLE public.transactions VALIDATE CONSTRAINT transactions_account_id_fkey;
ALTER TABLE public.transactions VALIDATE CONSTRAINT transactions_credit_card_id_fkey;

COMMIT;
