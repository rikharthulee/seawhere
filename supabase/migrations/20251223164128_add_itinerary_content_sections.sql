alter table public.day_itineraries
add column if not exists highlights text[] default '{}'::text[];

alter table public.day_itineraries
add column if not exists full_description text;

alter table public.day_itineraries
add column if not exists includes text[] default '{}'::text[];

alter table public.day_itineraries
add column if not exists not_suitable_for text[] default '{}'::text[];

alter table public.day_itineraries
add column if not exists important_information text[] default '{}'::text[];
