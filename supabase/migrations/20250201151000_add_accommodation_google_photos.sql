alter table public.accommodation
  add column if not exists google_place_id text,
  add column if not exists google_place_name text,
  add column if not exists google_formatted_address text,
  add column if not exists google_photos jsonb,
  add column if not exists google_photos_synced_at timestamptz,
  add column if not exists google_photos_status text,
  add column if not exists google_photos_error text;
