alter table public.sights
  add column if not exists geocode_source text,
  add column if not exists geocoded_place_name text;
