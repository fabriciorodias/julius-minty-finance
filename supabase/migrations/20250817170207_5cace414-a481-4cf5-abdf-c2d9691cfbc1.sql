
-- Create counterparties table
CREATE TABLE IF NOT EXISTS public.counterparties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  document TEXT,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to counterparties table
ALTER TABLE public.counterparties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for counterparties
CREATE POLICY "Users can view their own counterparties" 
  ON public.counterparties 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own counterparties" 
  ON public.counterparties 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own counterparties" 
  ON public.counterparties 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own counterparties" 
  ON public.counterparties 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add missing columns to transactions table if they don't exist
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS counterparty_id UUID REFERENCES public.counterparties(id),
ADD COLUMN IF NOT EXISTS is_reviewed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_counterparty_id ON public.transactions(counterparty_id);
CREATE INDEX IF NOT EXISTS idx_counterparties_user_id ON public.counterparties(user_id);
