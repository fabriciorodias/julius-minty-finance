-- Add favorite account fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN favorite_expense_account_id uuid,
ADD COLUMN favorite_income_account_id uuid;

-- Add comments for clarity
COMMENT ON COLUMN public.profiles.favorite_expense_account_id IS 'Default account for expense transactions';
COMMENT ON COLUMN public.profiles.favorite_income_account_id IS 'Default account for income transactions';