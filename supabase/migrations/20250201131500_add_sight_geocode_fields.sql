alter table public.sights
  add column if not exists geocoded_address text,
  add column if not exists geocode_place_id text,
  add column if not exists geocode_status text,
  add column if not exists geocoded_at timestamptz;

alter table public.sights
  add column if not exists lat double precision,
  add column if not exists lng double precision;
