# JapanMan Itinerary / Excursion Builder

> This document reflects the **current live schema** you shared.
> It does **not** propose changes. Any gaps needed for features (e.g., the itinerary checker) are called out at the end.

---

## Topology (quick map)

- **Geo**: `regions` → `prefectures` → `divisions` → `destinations`
- **Catalog**: `accommodation`, `food_drink`, `sights`, `tours`, `experiences`, `excursions` (+ `excursion_items`, `excursion_transport_legs`)
- **Transport refs**: `transport`, `transport_templates`
- **Itineraries**: `itineraries` → `itinerary_days` → `itinerary_day_items` (+ `itinerary_flights`; legacy: `itinerary_items`)
- **Users/Roles**: `profiles`, `user_roles`

---

## Regions

### `public.regions`

| Column      | Type        | Notes                       |
| ----------- | ----------- | --------------------------- |
| id          | uuid        | **PK**, `gen_random_uuid()` |
| name        | text        | not null                    |
| slug        | text        | **UNIQUE**                  |
| order_index | integer     |                             |
| created_at  | timestamptz | default `now()`             |
| summary     | text        |                             |

### Relationships (Regions)

- ← Referenced by `prefectures.region_id`

---

## Prefectures

### `public.prefectures`

| Column      | Type        | Notes                       |
| ----------- | ----------- | --------------------------- |
| id          | uuid        | **PK**, `gen_random_uuid()` |
| region_id   | uuid        | **FK** → `regions.id`       |
| name        | text        | not null                    |
| slug        | text        | **UNIQUE**                  |
| lat         | numeric     |                             |
| lng         | numeric     |                             |
| order_index | integer     |                             |
| created_at  | timestamptz | default `now()`             |

### Relationships (Prefectures)

- → `regions.id` (region)
- ← Referenced by `divisions.prefecture_id`, `destinations.prefecture_id`

---

## Divisions

### `public.divisions`

| Column        | Type        | Notes                       |
| ------------- | ----------- | --------------------------- |
| id            | uuid        | **PK**, `gen_random_uuid()` |
| prefecture_id | uuid        | **FK** → `prefectures.id`   |
| name          | text        | not null                    |
| slug          | text        | **UNIQUE**                  |
| description   | text        |                             |
| order_index   | integer     |                             |
| created_at    | timestamptz | default `now()`             |

### Relationships (Divisions)

- → `prefectures.id`
- ← Referenced by `destinations.division_id`, `accommodation.division_id`, `experiences.division_id`, `tours.division_id`, `sights.division_id`, `food_drink.division_id`, `hotels.division_id` (legacy)

---

## Destinations

### `public.destinations`

| Column          | Type        | Notes                                             |
| --------------- | ----------- | ------------------------------------------------- |
| id              | uuid        | **PK**, `gen_random_uuid()`                       |
| prefecture_id   | uuid        | **FK** → `prefectures.id`                         |
| division_id     | uuid        | **FK** → `divisions.id`                           |
| name            | text        | not null                                          |
| slug            | text        | **UNIQUE**                                        |
| summary         | text        |                                                   |
| body_richtext   | jsonb       |                                                   |
| hero_image      | text        |                                                   |
| thumbnail_image | text        |                                                   |
| credit          | text        |                                                   |
| lat             | numeric     |                                                   |
| lng             | numeric     |                                                   |
| status          | text        | default `draft`, check in `('draft','published')` |
| published_at    | timestamptz |                                                   |
| created_at      | timestamptz | default `now()`                                   |
| gyg_location_id | numeric     |                                                   |
| images          | jsonb       |                                                   |

### Relationships (Destinations)

- → `prefectures.id`, `divisions.id`
- ← Referenced by many catalog tables (`accommodation`, `hotels` (legacy), `sights`, `tours`, `experiences`, `food_drink`, `products`, `itineraries.destination_id` (optional))

---

## Accommodation (preferred over legacy `hotels`)

### `public.accommodation`

| Column          | Type        | Notes                                             |
| --------------- | ----------- | ------------------------------------------------- |
| id              | uuid        | **PK**, `gen_random_uuid()`                       |
| slug            | text        | **UNIQUE**, not null                              |
| name            | text        | not null                                          |
| summary         | text        |                                                   |
| description     | jsonb       |                                                   |
| address         | jsonb       |                                                   |
| lat             | numeric     |                                                   |
| lng             | numeric     |                                                   |
| rating          | numeric     |                                                   |
| price_band      | text        | check in `$$, $$$, $$$$, $$$$$`                   |
| hero_image      | text        |                                                   |
| website_url     | text        |                                                   |
| affiliate_url   | text        |                                                   |
| status          | text        | default `draft`, check in `('draft','published')` |
| created_at      | timestamptz | default `now()`                                   |
| credit          | text        |                                                   |
| images          | jsonb       |                                                   |
| thumbnail_image | text        |                                                   |
| prefecture_id   | uuid        | **FK** → `prefectures.id`                         |
| division_id     | uuid        | **FK** → `divisions.id`                           |
| destination_id  | uuid        | **FK** → `destinations.id`                        |

### Relationships (Accommodation)

- → `destinations.id`, `divisions.id`, `prefectures.id`
- ← Referenced by `itinerary_days.accommodation_id`

> **Note:** `public.hotels` also exists (legacy/lightweight). Prefer `accommodation`.

---

## Food & Drink

### `public.food_drink`

| Column         | Type        | Notes                                                                |
| -------------- | ----------- | -------------------------------------------------------------------- |
| id             | uuid        | **PK**, `gen_random_uuid()`                                          |
| destination_id | uuid        | **FK** → `destinations.id`                                           |
| name           | text        | not null                                                             |
| type           | text        | default `restaurant`, check in `('restaurant','bar','cafe','other')` |
| address        | text        |                                                                      |
| description    | text        |                                                                      |
| rating         | numeric     |                                                                      |
| images         | jsonb       |                                                                      |
| created_at     | timestamptz | default `now()`                                                      |
| updated_at     | timestamptz | default `now()`                                                      |
| division_id    | uuid        | **FK** → `divisions.id`                                              |

### Relationships (Food & Drink)

- → `destinations.id`, `divisions.id`

---

## Sights

### `public.sights`

| Column            | Type        | Notes                                             |
| ----------------- | ----------- | ------------------------------------------------- |
| id                | uuid        | **PK**, `gen_random_uuid()`                       |
| destination_id    | uuid        | **FK** → `destinations.id`                        |
| name              | text        | not null                                          |
| description       | text        |                                                   |
| created_at        | timestamptz | default `now()`                                   |
| slug              | text        | **UNIQUE**                                        |
| summary           | text        |                                                   |
| body_richtext     | jsonb       |                                                   |
| lat               | numeric     |                                                   |
| lng               | numeric     |                                                   |
| open_hours        | jsonb       |                                                   |
| images            | jsonb       |                                                   |
| tags              | ARRAY       | (untyped)                                         |
| status            | text        | default `draft`, check in `('draft','published')` |
| updated_at        | timestamptz | default `now()`                                   |
| duration_minutes  | integer     |                                                   |
| provider          | text        |                                                   |
| deeplink          | text        |                                                   |
| gyg_id            | numeric     |                                                   |
| price_jpy/gbp/usd | numeric     |                                                   |
| price_amount      | numeric     |                                                   |
| price_currency    | text        | default `JPY`                                     |
| division_id       | uuid        | **FK** → `divisions.id`                           |
| opening_times_url | text        |                                                   |
| maps_place_id     | text        |                                                   |

## Related tables (hours, exceptions, admission)

- `sight_opening_hours` — seasonal or ranged hours
- `sight_opening_exceptions` — exceptions/closures
- `sight_admission_prices` — ticket prices

### `public.sight_opening_hours`

| Column                | Type        | Notes                            |
| --------------------- | ----------- | -------------------------------- |
| id                    | uuid        | **PK**                           |
| sight_id              | uuid        | **FK** → `sights.id`             |
| start_month/end_month | integer     | 1–12                             |
| start_day/end_day     | integer     | 1–31 (nullable where not needed) |
| open_time/close_time  | time        |                                  |
| last_entry_mins       | int         | default 0                        |
| created_at/updated_at | timestamptz | default `now()`                  |
| days                  | jsonb       |                                  |
| is_closed             | boolean     | default false                    |

### `public.sight_opening_exceptions`

| Column                | Type         | Notes                |
| --------------------- | ------------ | -------------------- |
| id                    | uuid         | **PK**               |
| sight_id              | uuid         | **FK** → `sights.id` |
| type                  | USER-DEFINED | (enum in DB)         |
| start_date/end_date   | date         |                      |
| weekday               | smallint     | 0–6                  |
| note                  | text         |                      |
| created_at/updated_at | timestamptz  | default `now()`      |

### `public.sight_admission_prices`

| Column                | Type        | Notes                |
| --------------------- | ----------- | -------------------- |
| id                    | uuid        | **PK**               |
| sight_id              | uuid        | **FK** → `sights.id` |
| idx                   | int         | display order        |
| label                 | text        | e.g. Adult           |
| min_age/max_age       | int         |                      |
| requires_id           | boolean     | default false        |
| amount                | numeric     |                      |
| currency              | text        | default `JPY`        |
| is_free               | boolean     | default false        |
| valid_from/to         | date        |                      |
| note                  | text        |                      |
| external_url          | text        |                      |
| created_at/updated_at | timestamptz | default `now()`      |
| subsection            | text        |                      |

---

## Tours

### `public.tours`

| Column                                    | Type         | Notes                                             |
| ----------------------------------------- | ------------ | ------------------------------------------------- |
| id                                        | uuid         | **PK**, `gen_random_uuid()`                       |
| destination_id                            | uuid         | **FK** → `destinations.id`                        |
| name                                      | text         | not null                                          |
| slug                                      | text         | **UNIQUE**                                        |
| summary/description                       | text         |                                                   |
| body_richtext                             | jsonb        |                                                   |
| images                                    | jsonb        |                                                   |
| lat/lng                                   | numeric      |                                                   |
| duration_minutes                          | integer      |                                                   |
| price\_\* / price_amount / price_currency | numeric/text | default `JPY`                                     |
| provider                                  | text         |                                                   |
| deeplink                                  | text         |                                                   |
| status                                    | text         | default `draft`, check in `('draft','published')` |
| created_at/updated_at                     | timestamptz  | default `now()`                                   |
| price                                     | jsonb        |                                                   |
| gyg_id                                    | numeric      |                                                   |
| tags                                      | ARRAY        |                                                   |
| division_id                               | uuid         | **FK** → `divisions.id`                           |

## Operating days & exceptions

- `tour_availability_rules` (days_of_week + times + validity)
- `tour_exceptions` (per-date actions)

### `public.tour_availability_rules`

| Column        | Type    | Notes                |
| ------------- | ------- | -------------------- |
| id            | uuid    | **PK**               |
| tour_id       | uuid    | **FK** → `tours.id`  |
| idx           | integer | display order        |
| days_of_week  | ARRAY   | subset of `[0..6]`   |
| start_times   | ARRAY   | one or more          |
| valid_from/to | date    |                      |
| timezone      | text    | default `Asia/Tokyo` |

### `public.tour_exceptions`

| Column     | Type | Notes                                |
| ---------- | ---- | ------------------------------------ |
| id         | uuid | **PK**                               |
| tour_id    | uuid | **FK** → `tours.id`                  |
| date       | date | not null                             |
| action     | text | check in `('cancel','add','modify')` |
| start_time | time |                                      |
| note       | text |                                      |

---

## Experiences (parallel to Tours)

### `public.experiences`

| Column                | Type        | Notes                       |
| --------------------- | ----------- | --------------------------- |
| id                    | uuid        | **PK**, `gen_random_uuid()` |
| slug                  | text        | **UNIQUE**                  |
| name                  | text        | not null                    |
| created_at/updated_at | timestamptz | default `now()`             |
| destination_id        | uuid        | **FK** → `destinations.id`  |
| description/summary   | text        |                             |
| body_richtext         | jsonb       |                             |
| images                | jsonb       |                             |
| price                 | jsonb       |                             |
| lat/lng               | numeric     |                             |
| status                | text        |                             |
| price_jpy/gbp/usd     | numeric     |                             |
| gyg_id                | numeric     |                             |
| duration_minutes      | integer     |                             |
| provider/deeplink     | text        |                             |
| price_amount          | numeric     |                             |
| price_currency        | text        | default `JPY`               |
| tags                  | ARRAY       |                             |
| division_id           | uuid        | **FK** → `divisions.id`     |

## Availability & exceptions

- `experience_availability_rules` (like tours)
- `experience_exceptions`

### `public.experience_availability_rules`

| Column        | Type    | Notes                     |
| ------------- | ------- | ------------------------- |
| id            | uuid    | **PK**                    |
| experience_id | uuid    | **FK** → `experiences.id` |
| idx           | integer | default 0                 |
| days_of_week  | ARRAY   | subset of `[0..6]`        |
| start_times   | ARRAY   | one or more               |
| valid_from/to | date    |                           |
| timezone      | text    | default `Asia/Tokyo`      |

### `public.experience_exceptions`

| Column        | Type | Notes                                |
| ------------- | ---- | ------------------------------------ |
| id            | uuid | **PK**                               |
| experience_id | uuid | **FK** → `experiences.id`            |
| date          | date | not null                             |
| action        | text | check in `('cancel','add','modify')` |
| start_time    | time |                                      |
| note          | text |                                      |

---

## Excursions (builder-friendly bundles)

### `public.excursions`

| Column              | Type         | Notes                                             |
| ------------------- | ------------ | ------------------------------------------------- |
| id                  | uuid         | **PK**, `gen_random_uuid()`                       |
| name                | text         | not null                                          |
| description         | jsonb        |                                                   |
| maps_url            | text         |                                                   |
| status              | text         | default `draft`, check in `('draft','published')` |
| created_at          | timestamptz  | default `now()`                                   |
| updated_at          | timestamptz  |                                                   |
| summary             | text         |                                                   |
| destination_id      | uuid         | **FK** → `destinations.id`                        |
| slug                | text         |                                                   |
| cover_image         | text         |                                                   |
| tags                | ARRAY        |                                                   |
| cost_band           | USER-DEFINED |                                                   |
| notes               | text         |                                                   |
| wheelchair_friendly | boolean      | default false                                     |
| good_with_kids      | boolean      | default false                                     |

## Blocks & routing

- `excursion_items` — ordered content blocks
- `excursion_transport_legs` — A→B legs between items

### `public.excursion_items`

| Column       | Type    | Notes                                                       |
| ------------ | ------- | ----------------------------------------------------------- |
| id           | uuid    | **PK**, `gen_random_uuid()`                                 |
| excursion_id | uuid    | **FK** → `excursions.id`                                    |
| item_type    | text    | (e.g., `'sight'`, `'tour'`, `'experience'`, `'food_drink'`) |
| ref_id       | uuid    | points to catalog                                           |
| sort_order   | integer | default 0                                                   |

### `public.excursion_transport_legs`

| Column                | Type        | Notes                                                       |
| --------------------- | ----------- | ----------------------------------------------------------- |
| id                    | uuid        | **PK**, `gen_random_uuid()`                                 |
| excursion_id          | uuid        | **FK** → `excursions.id`                                    |
| from_item_id          | uuid        | **FK** → `excursion_items.id`                               |
| to_item_id            | uuid        | **FK** → `excursion_items.id`                               |
| template_id           | uuid        | **FK** → `transport_templates.id` (optional)                |
| primary_mode          | text        | enum: WALK/TRAIN/SUBWAY/BUS/TRAM/TAXI/DRIVE/FERRY/FLY/OTHER |
| title/summary         | text        |                                                             |
| steps                 | jsonb       | required                                                    |
| est_duration_min      | integer     |                                                             |
| est_distance_m        | integer     |                                                             |
| est_cost_min/max      | numeric     |                                                             |
| currency              | text        | default `JPY`                                               |
| notes                 | text        |                                                             |
| sort_order            | integer     |                                                             |
| created_at/updated_at | timestamptz | default `now()`                                             |

---

## Transport (reference)

### `public.transport`

| Column                | Type        | Notes                                                                 |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| id                    | uuid        | **PK**, `gen_random_uuid()`                                           |
| name                  | text        | not null                                                              |
| category              | text        | enum: station/bus_stop/bus_terminal/ferry_pier/airport/entrance/other |
| lat/lng               | numeric     |                                                                       |
| google_place_id       | text        |                                                                       |
| slug                  | text        | **UNIQUE**                                                            |
| notes                 | text        |                                                                       |
| created_at/updated_at | timestamptz | default `now()`                                                       |

### `public.transport_templates`

| Column                          | Type        | Notes                       |
| ------------------------------- | ----------- | --------------------------- |
| id                              | uuid        | **PK**, `gen_random_uuid()` |
| from_transport_id               | uuid        | **FK** → `transport.id`     |
| to_transport_id                 | uuid        | **FK** → `transport.id`     |
| primary_mode                    | text        | enum as above               |
| title/summary                   | text        |                             |
| steps                           | jsonb       | required                    |
| est_duration_min/est_distance_m | integer     |                             |
| est_cost_min/max                | numeric     |                             |
| currency                        | text        | default `JPY`               |
| tags                            | ARRAY       | default `'{}'`              |
| language                        | text        | default `en`                |
| version                         | integer     | default 1                   |
| is_active                       | boolean     | default true                |
| created_by                      | uuid        | **FK** → `auth.users.id`    |
| created_at/updated_at           | timestamptz | default `now()`             |

---

## Itineraries & Planning

### `public.itineraries`

| Column              | Type        | Notes                                                                 |
| ------------------- | ----------- | --------------------------------------------------------------------- |
| id                  | uuid        | **PK**, `gen_random_uuid()`                                           |
| owner_id            | uuid        | **FK** → `profiles.id`                                                |
| title               | text        |                                                                       |
| destination_id      | uuid        | **FK** → `destinations.id` (optional high-level anchor)               |
| start_date/end_date | date        |                                                                       |
| status              | text        | default `draft`, check in `('draft','shared','confirmed','archived')` |
| visibility          | text        | default `private`, check in `('private','unlisted','public')`         |
| notes               | jsonb       |                                                                       |
| created_at          | timestamptz | default `now()`                                                       |
| created_by          | uuid        | default `auth.uid()`                                                  |

### `public.itinerary_days`

| Column             | Type    | Notes                       |
| ------------------ | ------- | --------------------------- |
| id                 | uuid    | **PK**, `gen_random_uuid()` |
| itinerary_id       | uuid    | **FK** → `itineraries.id`   |
| day_index          | integer | not null                    |
| title              | text    |                             |
| destination_id     | uuid    | **FK** → `destinations.id`  |
| sub_destination_id | uuid    | **FK** → `destinations.id`  |
| accommodation_id   | uuid    | **FK** → `accommodation.id` |
| date               | date    |                             |
| created_by         | uuid    | default `auth.uid()`        |

### `public.itinerary_day_items` (polymorphic)

| Column     | Type        | Notes                                                        |
| ---------- | ----------- | ------------------------------------------------------------ |
| id         | uuid        | **PK**, `gen_random_uuid()`                                  |
| day_id     | uuid        | **FK** → `itinerary_days.id`                                 |
| item_type  | text        | check in `('hotel','excursion','sight','tour','food_drink')` |
| ref_id     | uuid        | points to catalog id                                         |
| notes      | text        |                                                              |
| sort_order | integer     | default 0                                                    |
| created_at | timestamptz | default `now()`                                              |
| created_by | uuid        | default `auth.uid()`                                         |

### `public.itinerary_flights`

| Column                            | Type        | Notes                       |
| --------------------------------- | ----------- | --------------------------- |
| id                                | uuid        | **PK**, `gen_random_uuid()` |
| itinerary_id                      | uuid        | **FK** → `itineraries.id`   |
| flight_number                     | text        |                             |
| departure_airport/arrival_airport | text        |                             |
| departure_time/arrival_time       | timestamptz |                             |
| created_at                        | timestamptz | default `now()`             |
| created_by                        | uuid        | default `auth.uid()`        |

### (Legacy/parallel) `public.itinerary_items`

| Column                | Type        | Notes                                                                 |
| --------------------- | ----------- | --------------------------------------------------------------------- |
| id                    | uuid        | **PK**, `gen_random_uuid()`                                           |
| itinerary_day_id      | uuid        | **FK** → `itinerary_days.id`                                          |
| position              | integer     | not null                                                              |
| kind                  | text        | check in `('poi','accommodation','note','transport','meal','custom')` |
| ref_id                | uuid        |                                                                       |
| start_time/end_time   | time        |                                                                       |
| meta                  | jsonb       |                                                                       |
| created_at            | timestamptz | default `now()`                                                       |
| accommodation_item_id | uuid        | **FK** → `accommodation.id`                                           |
| title_override        | text        |                                                                       |

> Use `itinerary_day_items` for new UI; this table looks like an older model.

---

## Users & Roles

### `public.profiles`

| Column       | Type        | Notes                                                        |
| ------------ | ----------- | ------------------------------------------------------------ |
| id           | uuid        | **PK**, **FK** → `auth.users.id`                             |
| role         | text        | default `customer`, check in `('admin','editor','customer')` |
| display_name | text        |                                                              |
| avatar_url   | text        |                                                              |
| created_at   | timestamptz | default `now()`                                              |

### `public.user_roles`

| Column     | Type        | Notes                                               |
| ---------- | ----------- | --------------------------------------------------- |
| user_id    | uuid        | **PK**, **FK** → `auth.users.id`                    |
| role       | text        | default `customer`, check in `('admin','customer')` |
| updated_at | timestamptz | default `now()`                                     |

> Roles exist in both `profiles.role` and `user_roles.role`. Align usage at the app layer.

---

## Noted but out-of-scope (aux/content)

- `articles`, `products`, `product_items` — content/commerce; not required for itinerary logic.
- `exchange_rates`, `categories`, `category_links`, `destination_links` — helpful but not core to builder/checker.

---

## Feature Gaps vs. Itinerary Checker (FYI only)

The checker we discussed needs **per-sight** fields that are **not present** today:

- `closed_days text[]`
- `holiday_policy text` (`open | closed | unknown`)
- `defer_closure_on_holiday text` (`never | next_weekday`)
- `notes_url text` (link to official site)

You already have rich hour/exception tables — the above are **minimal additive flags** for MVP logic if/when you choose to implement the checker.

---

## Appendix: Polymorphic References (cheat sheet)

- `itinerary_day_items.item_type` + `ref_id` → one of:

  - `hotel` → **accommodation.id** (use `accommodation` as the hotel source)
  - `sight` → **sights.id**
  - `tour` → **tours.id** (or show `experiences` side by side in UI)
  - `food_drink` → **food_drink.id**
  - `excursion` → **excursions.id**

- `excursion_items.item_type` + `ref_id` → catalog table IDs (sight/tour/experience/food).
