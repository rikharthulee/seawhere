alter table public.day_itinerary_items
add column if not exists is_optional boolean not null default false;

alter table public.day_itinerary_items
add column if not exists meal_type text
check (meal_type in ('breakfast','lunch','dinner','coffee'));
