
ALTER TABLE public.cabins
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS title_de text,
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS description_de text,
  ADD COLUMN IF NOT EXISTS translated_at timestamptz;
