-- Adicionar campos de branding à tabela institutions
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS secondary_color TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.institutions.logo_url IS 'URL da logo da instituição (externa ou storage)';
COMMENT ON COLUMN public.institutions.primary_color IS 'Cor primária da instituição em formato hex (#RRGGBB)';
COMMENT ON COLUMN public.institutions.secondary_color IS 'Cor secundária da instituição em formato hex (#RRGGBB)';