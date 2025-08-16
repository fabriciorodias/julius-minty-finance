
-- 1) Adiciona a coluna de ordenação
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;

-- 2) Backfill: define uma ordem inicial por grupo (user_id, type, parent_id)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, type, parent_id
      ORDER BY created_at ASC, name ASC
    ) - 1 AS rn
  FROM public.categories
)
UPDATE public.categories AS c
SET display_order = r.rn
FROM ranked r
WHERE c.id = r.id;

-- 3) Índice para facilitar ordenação por grupos
CREATE INDEX IF NOT EXISTS categories_order_idx
  ON public.categories (user_id, type, parent_id, display_order);
