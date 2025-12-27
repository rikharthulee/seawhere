alter table public.trips
  add column if not exists hero_image text,
  add column if not exists thumbnail_image text;
