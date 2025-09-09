-- Idempotent columns for POI duration and price
ALTER TABLE public.poi ADD COLUMN IF NOT EXISTS duration_minutes integer;
ALTER TABLE public.poi ADD COLUMN IF NOT EXISTS price jsonb;

