drop table if exists public.trip_stops;

create table if not exists public.day_itinerary_stops (
  id uuid primary key default gen_random_uuid(),
  day_itinerary_id uuid not null references public.day_itineraries(id) on delete cascade,
  title text not null,
  description text,
  stop_type text not null default 'stop',
  latitude double precision not null,
  longitude double precision not null,
  image_url text,
  order_index int not null default 0,
  is_optional boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint day_itinerary_stops_stop_type_check
    check (stop_type in (
      'stop',
      'waterfall',
      'cafe',
      'food',
      'town',
      'viewpoint',
      'temple',
      'overnight',
      'optional'
    ))
);

create index if not exists day_itinerary_stops_itinerary_order_idx
  on public.day_itinerary_stops (day_itinerary_id, order_index);

alter table public.day_itinerary_stops enable row level security;

create policy "Day itinerary stops read published"
  on public.day_itinerary_stops
  for select
  using (
    exists (
      select 1
      from public.day_itineraries
      where day_itineraries.id = day_itinerary_stops.day_itinerary_id
        and day_itineraries.status = 'published'
    )
  );

create policy "Day itinerary stops admin access"
  on public.day_itinerary_stops
  for all
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'editor')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'editor')
    )
  );

grant select on table public.day_itinerary_stops to anon;
grant select, insert, update, delete on table public.day_itinerary_stops to authenticated;
grant select, insert, update, delete on table public.day_itinerary_stops to service_role;
