# JapanMan Itinerary Builder — Full Spec (v2 with Food & Drink)

_Last updated: 2025‑09‑13_

## 1) Overview
An admin-facing drag‑and‑drop **Itinerary Builder** for constructing multi-day Japan trips. Editors assemble days by dropping **Destinations, Hotels, Sights, Tours, Excursions, Flights, and Food & Drink** into a canvas. Customers can view and manage their own itineraries (add/remove items), while the public site can browse catalog data (destinations, hotels, sights, tours, food & drink, excursions).

Goals:
- Fast admin UX with DnD, virtualized lists, keyboard flows.
- Clean data model with minimal polymorphism.
- **Food & Drink** is a first‑class catalog item (like Hotels/Sights/Tours).
- RLS: public read for catalog, admin manage; customers own their itineraries.
- Non‑destructive migrations where possible.

---

## 2) Data Model (Postgres)
**Naming:** `public.*`. IDs are `uuid` with `gen_random_uuid()`.

### 2.1 destinations
- `id` uuid PK  
- `slug` text UNIQUE (e.g., "tokyo")  
- `name` text not null  
- `region` text  
- `lat` numeric, `lng` numeric  
- `hero_image_url` text  
- `status` text check in ('active','hidden') default 'active'

### 2.2 hotels
- `id` uuid PK  
- `destination_id` uuid FK → destinations  
- `name` text not null  
- `slug` text UNIQUE  
- `address` jsonb  
- `rating` numeric  
- `price_band` text check in ('$','$$','$$$','$$$$')  
- `images` jsonb[] or jsonb (array of urls)  
- `meta` jsonb (brand, amenities)  
- `status` text ('active','hidden')

### 2.3 sights
- `id` uuid PK  
- `destination_id` uuid FK  
- `name` text not null  
- `slug` text UNIQUE  
- `summary` text  
- `body_richtext` jsonb (or markdown)  
- `open_hours` jsonb  
- `images` jsonb  
- `tags` text[]  
- `status` text

### 2.4 tours
- `id` uuid PK  
- `destination_id` uuid FK (nullable for multi-city tours)  
- `provider` text  
- `name` text not null  
- `duration_minutes` int  
- `meeting_point` text  
- `operating_days` text[] ('mon'..'sun')  
- `price_from` numeric  
- `images` jsonb  
- `status` text

### 2.5 excursion_templates
- `id` uuid PK  
- `slug` text UNIQUE  
- `title` text not null  
- `summary` text  
- `start_destination_id` uuid FK  
- `end_destination_id` uuid FK (nullable; defaults to start)  
- `duration_days` int not null default 1  
- `duration_minutes` int not null default 0 — intra-day time budget  
- `difficulty` text check in ('easy','moderate','intense')  
- `tags` text[]  
- `cover_image_url` text  
- `content` jsonb — ordered blocks; see 2.6  
- `status` text check in ('draft','published') default 'draft'  
- `version` int default 1  
- `created_by` uuid (admin user)  
- `updated_at` timestamptz

### 2.6 excursion_blocks (optional normalized child if not using a single jsonb)
- `id` uuid PK  
- `excursion_id` uuid FK → excursion_templates  
- `order_index` int not null  
- `type` text check in ('sight','tour','meal','transfer','note','buffer')  
- `ref_id` uuid nullable (→ sights/tours)  
- `payload` jsonb — time ranges, notes, internal tips, images

### 2.7 food_drink (NEW)
- `id` uuid PK  
- `destination_id` uuid FK → destinations  
- `name` text not null  
- `slug` text UNIQUE  
- `type` text check in ('restaurant','bar','cafe','other') default 'restaurant'  
- `address` text or jsonb  
- `description` text  
- `rating` numeric  
- `price_band` text check in ('$','$$','$$$','$$$$')  
- `images` jsonb  
- `tags` text[]  
- `status` text ('active','hidden')  
- `created_at` timestamptz default now()  
- `updated_at` timestamptz default now()

### 2.8 itineraries
- `id` uuid PK  
- `name` text not null  
- `customer_name` text  
- `status` text default 'draft'  
- `start_date` date  
- `end_date` date  
- `created_by` uuid default auth.uid()  
- `created_at` timestamptz default now()

### 2.9 itinerary_days
- `id` uuid PK  
- `itinerary_id` uuid FK → itineraries on delete cascade  
- `day_number` int not null  
- `date` date  
- `destination_id` uuid FK → destinations  
- `created_by` uuid default auth.uid()  
- `created_at` timestamptz default now()

### 2.10 itinerary_day_items (polymorphic)
- `id` uuid PK  
- `day_id` uuid FK → itinerary_days on delete cascade  
- `item_type` text not null **check in ('hotel','excursion','sight','tour','food_drink')**  
- `ref_id` uuid not null — points at the ID in the respective catalog table  
- `notes` text  
- `sort_order` int not null default 0  
- `created_by` uuid default auth.uid()  
- `created_at` timestamptz default now()

### 2.11 itinerary_flights
- `id` uuid PK  
- `itinerary_id` uuid FK → itineraries on delete cascade  
- `flight_number` text  
- `departure_airport` text, `arrival_airport` text  
- `departure_time` timestamptz, `arrival_time` timestamptz  
- `created_by` uuid default auth.uid()  
- `created_at` timestamptz default now()

**Indexes (representative):**
```sql
create index if not exists idx_hotels_destination on public.hotels(destination_id);
create index if not exists idx_sights_destination on public.sights(destination_id);
create index if not exists idx_tours_destination on public.tours(destination_id);
create index if not exists idx_food_drink_destination on public.food_drink(destination_id);
create index if not exists idx_itinerary_days_itinerary on public.itinerary_days(itinerary_id);
create index if not exists idx_day_items_day on public.itinerary_day_items(day_id);
```

**Migration tweak for `item_type`:**
```sql
do $$
begin
  -- If a previous CHECK exists, drop & recreate with the expanded set
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.itinerary_day_items'::regclass
      and contype = 'c'
      and conname = 'itinerary_day_items_item_type_check'
  ) then
    alter table public.itinerary_day_items
      drop constraint itinerary_day_items_item_type_check;
  end if;

  alter table public.itinerary_day_items
    add constraint itinerary_day_items_item_type_check
    check (item_type in ('hotel','excursion','sight','tour','food_drink'));
end$$;
```

---

## 3) RLS & Roles
### Roles
- **admin**: full CRUD on all tables.
- **customer**: read catalog; CRUD only on rows they own in itinerary tables.
- **public (anon)**: read-only on catalog tables.

### Role storage
```sql
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','customer')) default 'customer',
  updated_at timestamptz default now()
);

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_customer() returns boolean
language sql stable as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'customer');
$$;
```

### Enable RLS (tables)
Enable on: `destinations, hotels, sights, tours, food_drink, excursion_templates, excursion_blocks, itineraries, itinerary_days, itinerary_day_items, itinerary_flights, user_roles`.

### Policies (summary)
- **Catalog** (`destinations, hotels, sights, tours, food_drink, excursion_templates, excursion_blocks`)
  - `public_read_*`: `using (true)`
  - `admin_all_*`: `for all using (is_admin()) with check (is_admin())`
- **Owned** (`itineraries, itinerary_days, itinerary_day_items, itinerary_flights`)
  - `admin_all_*`: as above
  - `customer_crud_*`: `for all using (is_customer() and created_by = auth.uid()) with check (same)`
- **user_roles**
  - `admin_all_user_roles`: admin everything
  - `self_read_user_role`: user can read their own row

> Service role bypasses RLS as usual.

---

## 4) Admin UI — Pages & Components
### 4.1 Routes
- `/admin/itineraries` → list & search
- `/admin/itineraries/[id]` → **Editor** (dnd-kit)
- `/admin/excursions/[id]` → Excursion builder (timeline)

### 4.2 Editor layout
- **EditorHeader**
- **EditorRoot** (DndContext)
  - **LibrarySidebar**
    - **LibraryTabs**: _Destinations • Hotels • Sights • Tours • **Food & Drink** • Excursions_
    - **LibraryList** (virtualized)
  - **DaysCanvas**
    - `DayCard` × N → `DayItemsList (Droppable)`
  - **InspectorSidebar**
- **ValidateToast / Dialogs**

### 4.3 Library behaviors
- Filter by destination; text search; type facets (for food & drink: restaurant/bar/cafe/other).
- Drag row → creates `itinerary_day_items` with:
  - `item_type` = 'hotel'|'sight'|'tour'|'excursion'|'food_drink'
  - `ref_id` = dropped item id
  - `day_id` = current day; `sort_order` by position

### 4.4 Inspector behaviors
- Shared: notes (rich), start/end time (optional), cost (optional).
- Food & Drink: booking URL (validate http/https), type badge.

---

## 5) API Contracts (Supabase REST)
**List catalog (public or admin):**
```
GET /rest/v1/destinations?select=*
GET /rest/v1/hotels?select=*&destination_id=eq.:dest
GET /rest/v1/sights?select=*&destination_id=eq.:dest
GET /rest/v1/tours?select=*&destination_id=eq.:dest
GET /rest/v1/food_drink?select=*&destination_id=eq.:dest&type=eq.:type
GET /rest/v1/excursion_templates?select=*
```
**Builder write (admin or customer for own itinerary):**
```
POST /rest/v1/itinerary_day_items
{ day_id, item_type:'food_drink'|... , ref_id, sort_order, notes }

PATCH /rest/v1/itinerary_day_items?id=eq.:id
DELETE /rest/v1/itinerary_day_items?id=eq.:id
```
**Flights:**
```
POST /rest/v1/itinerary_flights
PATCH /rest/v1/itinerary_flights?id=eq.:id
DELETE /rest/v1/itinerary_flights?id=eq.:id
```

---

## 6) Validation & Constraints
- `item_type` constrained by CHECK (includes `'food_drink'`).
- Optional: app-level rule “only one of a kind per time slot” per day.
- Unique slugs on catalog tables.
- (Optional) partial unique to prevent duplicate identical items on the same day:
  - app-enforced or DB via unique index on `(day_id, item_type, ref_id)` if desired.

---

## 7) Migrations (non-destructive)
- Create `food_drink` table if missing.
- Add/replace `itinerary_day_items_item_type_check` to include `'food_drink'`.
- RLS: add public read/admin manage for `food_drink`.
- No data moves required.

_SQL blocks are embedded above in sections 2 and 3._

---

## 8) Storage & Images
- Buckets used by hotels/sights/tours/food_drink should allow public read (or signed URLs). Ensure bucket-level policies match the catalog visibility.

---

## 9) Performance
- Index by `destination_id` on catalog tables.
- Index joins: `itinerary_days(itinerary_id)`, `itinerary_day_items(day_id)`.
- Prefer narrow selects in LibraryList (`select id,name,type,rating` etc.).

---

## 10) QA Checklist
- Public site (anon) can fetch catalog lists incl. **Food & Drink**.
- Admin can create/edit/delete catalog and itinerary items.
- Customer can CRUD their own itinerary; cannot see/modify others.
- DnD creates correct `item_type` + `ref_id` rows.
- Images load from Storage for catalog cards.

---

## 11) Nice‑to‑have (later)
- Cuisine tags & opening hours normalization for Food & Drink.
- Soft deletes (`status='hidden'`) with admin toggle.
- Time budgeting per day with color feedback.
