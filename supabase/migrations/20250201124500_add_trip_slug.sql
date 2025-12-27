alter table public.trips
  add column if not exists slug text;

create unique index if not exists trips_slug_key on public.trips (slug);
