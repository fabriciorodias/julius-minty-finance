-- Remove the existing check constraint and add a new one that includes 'despesa_planejada'
ALTER TABLE public.plans DROP CONSTRAINT IF EXISTS plans_type_check;

-- Add the new check constraint that includes all three plan types
ALTER TABLE public.plans ADD CONSTRAINT plans_type_check 
CHECK (type IN ('poupanca', 'divida', 'despesa_planejada'));