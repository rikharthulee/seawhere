-- Add optional presentation fields for countries (non-destructive)
ALTER TABLE public.countries
ADD COLUMN IF NOT EXISTS summary text,
ADD COLUMN IF NOT EXISTS hero_image text;

-- Helpful index for text search/filtering on country name
CREATE INDEX IF NOT EXISTS idx_countries_name ON public.countries USING btree (name);
