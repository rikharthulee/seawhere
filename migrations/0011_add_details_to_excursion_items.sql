ALTER TABLE public.excursion_items
  ADD COLUMN details text,
  ADD COLUMN duration_minutes integer,
  ADD COLUMN maps_url text;
