-- Adicionar coluna next_due_date na tabela accounts
ALTER TABLE public.accounts 
ADD COLUMN next_due_date date;