-- Enforce unique slugs for excursions (public pages use slug routes)

-- Optional: ensure a helper btree index exists for slug lookups
create index if not exists idx_excursions_slug on public.excursions (slug);

-- Enforce uniqueness for non-null slugs
create unique index if not exists uq_excursions_slug on public.excursions (slug) where slug is not null;

