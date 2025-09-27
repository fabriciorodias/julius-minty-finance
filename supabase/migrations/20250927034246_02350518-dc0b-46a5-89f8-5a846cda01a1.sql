-- Migration: Simplify transactions model
-- Remove status and effective_date fields, add input_source field

-- Create enum for input_source
CREATE TYPE input_source_type AS ENUM ('manual', 'import', 'ai_agent', 'recurring', 'installment');

-- Add the new input_source column with default value
ALTER TABLE public.transactions 
ADD COLUMN input_source input_source_type NOT NULL DEFAULT 'manual';

-- Update existing data based on current patterns
-- Set 'recurring' for transactions that have counterparty and recurring patterns
UPDATE public.transactions 
SET input_source = 'recurring' 
WHERE counterparty_id IS NOT NULL 
  AND description ILIKE '%mensal%' OR description ILIKE '%recorrente%';

-- Set 'installment' for transactions that have installment data
UPDATE public.transactions 
SET input_source = 'installment' 
WHERE installment_id IS NOT NULL OR total_installments IS NOT NULL;

-- Update the get_account_balances function to remove status filtering
CREATE OR REPLACE FUNCTION public.get_account_balances(p_as_of_date date DEFAULT (now())::date)
 RETURNS TABLE(account_id uuid, current_balance numeric)
 LANGUAGE sql
AS $function$
  SELECT
    a.id AS account_id,
    COALESCE(ib.amount, 0)::numeric
    + COALESCE(
        SUM(
          CASE
            WHEN t.type = 'despesa' THEN -ABS(t.amount)
            WHEN t.type = 'receita' THEN ABS(t.amount)
            ELSE 0
          END
        ) FILTER (
          WHERE t.event_date >= COALESCE(ib.balance_date, DATE '1900-01-01')
            AND t.event_date <= p_as_of_date
        ),
        0
      )::numeric AS current_balance
  FROM public.accounts a
  LEFT JOIN public.account_initial_balances ib
    ON ib.account_id = a.id
    AND ib.user_id = a.user_id
  LEFT JOIN public.transactions t
    ON t.account_id = a.id
    AND t.user_id = a.user_id
  WHERE a.user_id = auth.uid()
  GROUP BY a.id, ib.amount, ib.balance_date;
$function$;

-- Now remove the status and effective_date columns
ALTER TABLE public.transactions DROP COLUMN IF EXISTS status;
ALTER TABLE public.transactions DROP COLUMN IF EXISTS effective_date;