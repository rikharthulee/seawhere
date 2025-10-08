-- Ensure global unique slugs for experiences (slug-first public routes)

create index if not exists idx_experiences_slug on public.experiences (slug);

create unique index if not exists uq_experiences_slug on public.experiences (slug) where slug is not null;

