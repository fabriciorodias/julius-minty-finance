-- Add payment_type column to plans table
ALTER TABLE public.plans 
ADD COLUMN payment_type TEXT NOT NULL DEFAULT 'installments' 
CHECK (payment_type IN ('installments', 'lump_sum'));

-- Add comment to explain the new column
COMMENT ON COLUMN public.plans.payment_type IS 'Type of payment: installments for monthly payments, lump_sum for single payment';

-- Update existing plans to use installments as default
UPDATE public.plans SET payment_type = 'installments' WHERE payment_type IS NULL;