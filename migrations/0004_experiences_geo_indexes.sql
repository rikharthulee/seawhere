-- Indexes and FK to support Experiences geo pages
-- Safe to run multiple times

-- Speed up lookups by destination
create index if not exists idx_experiences_destination on public.experiences (destination_id);

-- Ensure geo filters on destinations are fast
create index if not exists idx_destinations_prefecture on public.destinations (prefecture_id);
create index if not exists idx_destinations_division on public.destinations (division_id);

-- Availability/exception lookups by experience
create index if not exists idx_experience_rules_experience on public.experience_availability_rules (experience_id);
create index if not exists idx_experience_exceptions_experience on public.experience_exceptions (experience_id);

-- Add missing FK for experiences.destination_id → destinations.id (if not present)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'experiences_destination_id_fkey'
  ) then
    alter table public.experiences
      add constraint experiences_destination_id_fkey
      foreign key (destination_id) references public.destinations(id);
  end if;
end $$;

