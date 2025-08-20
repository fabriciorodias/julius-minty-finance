
-- Garantir que RLS está habilitado
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Permitir INSERT do próprio usuário, vinculando apenas a recursos do próprio usuário
CREATE POLICY "Users can insert their own transactions (import)"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    account_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.accounts a
      WHERE a.id = transactions.account_id
        AND a.user_id = auth.uid()
    )
  )
  AND (
    credit_card_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.credit_cards c
      WHERE c.id = transactions.credit_card_id
        AND c.user_id = auth.uid()
    )
  )
);
