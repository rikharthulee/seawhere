-- Remove legacy opening-hours seeding that references outdated columns
-- Safe to run multiple times

-- Drop trigger that runs after inserting into sights
DROP TRIGGER IF EXISTS trg_sight_seed_opening_hours ON public.sights;

-- Drop the underlying function if present
DROP FUNCTION IF EXISTS public.sight_seed_opening_hours();

