-- Idempotent migration to ensure poi.details exists as JSONB
ALTER TABLE public.poi ADD COLUMN IF NOT EXISTS details jsonb;

