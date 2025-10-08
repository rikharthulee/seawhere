-- Ensure global unique slugs for sights (slug-first public routes)

create index if not exists idx_sights_slug on public.sights (slug);

create unique index if not exists uq_sights_slug on public.sights (slug) where slug is not null;

