create table if not exists public.country_guides (
  country_slug text primary key,
  intro text,
  facts jsonb not null default '[]'::jsonb,
  status public.content_status not null default 'published'::public.content_status
);

alter table public.country_guides
  add constraint country_guides_country_slug_fkey
  foreign key (country_slug) references public.countries (slug) on delete cascade;

create table if not exists public.country_guide_sections (
  id uuid primary key default gen_random_uuid(),
  country_slug text not null,
  title text not null,
  slug text not null,
  summary text,
  position integer not null default 0,
  status public.content_status not null default 'published'::public.content_status
);

alter table public.country_guide_sections
  add constraint country_guide_sections_country_slug_fkey
  foreign key (country_slug) references public.country_guides (country_slug) on delete cascade;

create unique index if not exists country_guide_sections_country_slug_slug_key
  on public.country_guide_sections (country_slug, slug);

create index if not exists country_guide_sections_country_slug_position_idx
  on public.country_guide_sections (country_slug, position);

create table if not exists public.country_guide_blocks (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null,
  type text not null,
  position integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'published'::public.content_status
);

alter table public.country_guide_blocks
  add constraint country_guide_blocks_section_id_fkey
  foreign key (section_id) references public.country_guide_sections (id) on delete cascade;

create index if not exists country_guide_blocks_section_id_position_idx
  on public.country_guide_blocks (section_id, position);
