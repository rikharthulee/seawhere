alter table public.food_drink
  add column if not exists geocoded_address text,
  add column if not exists geocode_place_id text,
  add column if not exists geocode_status text,
  add column if not exists geocoded_at timestamptz;
