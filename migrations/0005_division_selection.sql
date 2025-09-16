-- Add division_id columns to key content tables and create the helper RPC
-- This migration is safe to run once; IF NOT EXISTS used where applicable.

-- sights
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.sights ADD COLUMN division_id uuid NULL;
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;
END $$;
ALTER TABLE public.sights
  ADD CONSTRAINT IF NOT EXISTS sights_division_id_fkey
  FOREIGN KEY (division_id) REFERENCES public.divisions(id);
CREATE INDEX IF NOT EXISTS sights_division_id_idx ON public.sights(division_id);

-- tours
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.tours ADD COLUMN division_id uuid NULL;
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;
END $$;
ALTER TABLE public.tours
  ADD CONSTRAINT IF NOT EXISTS tours_division_id_fkey
  FOREIGN KEY (division_id) REFERENCES public.divisions(id);
CREATE INDEX IF NOT EXISTS tours_division_id_idx ON public.tours(division_id);

-- experiences
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.experiences ADD COLUMN division_id uuid NULL;
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;
END $$;
ALTER TABLE public.experiences
  ADD CONSTRAINT IF NOT EXISTS experiences_division_id_fkey
  FOREIGN KEY (division_id) REFERENCES public.divisions(id);
CREATE INDEX IF NOT EXISTS experiences_division_id_idx ON public.experiences(division_id);

-- food_drink (if present)
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.food_drink ADD COLUMN division_id uuid NULL;
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;
EXCEPTION WHEN undefined_table THEN
  -- table not present; skip
  NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.food_drink
    ADD CONSTRAINT IF NOT EXISTS food_drink_division_id_fkey
    FOREIGN KEY (division_id) REFERENCES public.divisions(id);
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS food_drink_division_id_idx ON public.food_drink(division_id);
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- hotels (if present, separate from accommodation)
DO $$ BEGIN
  BEGIN
    ALTER TABLE public.hotels ADD COLUMN division_id uuid NULL;
  EXCEPTION WHEN duplicate_column THEN
    NULL;
  END;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.hotels
    ADD CONSTRAINT IF NOT EXISTS hotels_division_id_fkey
    FOREIGN KEY (division_id) REFERENCES public.divisions(id);
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS hotels_division_id_idx ON public.hotels(division_id);
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- RPC: get_divisions_for_destination(dst_id uuid)
-- Returns divisions applicable to a destination: if destination is tied to a
-- specific division, return just that; otherwise return all divisions in its prefecture.
DROP FUNCTION IF EXISTS public.get_divisions_for_destination(uuid);
CREATE FUNCTION public.get_divisions_for_destination(dst_id uuid)
RETURNS SETOF public.divisions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH dst AS (
    SELECT id, prefecture_id, division_id
    FROM public.destinations
    WHERE id = dst_id
  )
  SELECT d.*
  FROM public.divisions d
  WHERE d.id = (SELECT division_id FROM dst)
    AND (SELECT division_id FROM dst) IS NOT NULL
  UNION
  SELECT d.*
  FROM public.divisions d
  WHERE d.prefecture_id = (SELECT prefecture_id FROM dst)
    AND (SELECT division_id FROM dst) IS NULL
  ORDER BY name ASC;
$$;

-- Grant execute to typical roles so client-side RPC can call it
DO $$ BEGIN
  GRANT EXECUTE ON FUNCTION public.get_divisions_for_destination(uuid) TO anon, authenticated, service_role;
EXCEPTION WHEN undefined_object THEN
  -- Roles may differ; ignore missing
  NULL;
END $$;

