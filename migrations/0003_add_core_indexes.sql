-- Core indexes to keep lookups instant
-- Safe to run multiple times with IF NOT EXISTS

-- Slugs
create index if not exists idx_sights_slug on public.sights (slug);
create index if not exists idx_experiences_slug on public.experiences (slug);
create index if not exists idx_destinations_slug on public.destinations (slug);

-- Foreign keys
create index if not exists idx_sights_destination on public.sights (destination_id);
create index if not exists idx_experiences_sight on public.experiences (sight_id);
create index if not exists idx_sight_hours_sight on public.sight_opening_hours (sight_id);
create index if not exists idx_sight_exceptions_sight on public.sight_opening_exceptions (sight_id);

