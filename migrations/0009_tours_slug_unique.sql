-- Ensure global unique slugs for tours (slug-first public routes)

create index if not exists idx_tours_slug on public.tours (slug);

create unique index if not exists uq_tours_slug on public.tours (slug) where slug is not null;

