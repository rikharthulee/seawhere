# Seawhere

Next.js 15 + Supabase app for building and browsing Southeast Asia trips. The stack uses the App Router with SSR for public pages and a client-side admin workspace for editing content.

## Environment

Required env vars for Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
  - Required for server-side admin upload APIs and scripts.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the app.

## Project structure

- `src/app`: App Router pages and API routes.
- `src/lib`: Supabase clients, data helpers, and shared utilities.
- `public`: Static assets.
- `scripts`: Maintenance scripts (e.g. blob migrations).

## Conventions

- Await App Router params: `const { slug } = await params;`
- Public pages should filter `status = 'published'` and avoid caching empty states during content entry.
- Admin APIs run on the Node runtime and require an authenticated session.

## Feature map

- Countries → destinations → points of interest (sights, experiences, tours, food & drink, accommodation).
- Day itineraries (formerly excursions) are curated bundles of items plus transport legs.
- Admin tooling lives under `/admin/*`; public browsing under `/countries/[slug]`, `/destinations/[slug]`, `/sights`, `/experiences`, `/tours`, etc.

## Routes

Public pages

- `/` home
- `/about`, `/blog`, `/contact`, `/faq`, `/search`
- `/tours`, `/tours/[slug]`
- `/trips`, `/trips/[slug]`
- `/day-itineraries`, `/day-itineraries/[slug]`
- `/countries`
- `/countries/[countrySlug]`
- `/countries/[countrySlug]/[destinationSlug]`
- `/countries/[countrySlug]/[destinationSlug]/sights` and `/sights/[sightSlug]`
- `/countries/[countrySlug]/[destinationSlug]/experiences` and `/experiences/[experienceSlug]`
- `/countries/[countrySlug]/[destinationSlug]/tours` and `/tours/[tourSlug]`
- `/countries/[countrySlug]/[destinationSlug]/accommodation` and `/accommodation/[placeSlug]`
- `/countries/[countrySlug]/[destinationSlug]/food-drink` and `/food-drink/[placeSlug]`
- `/countries/[countrySlug]/[destinationSlug]/transport`

Admin pages

- `/admin` dashboard
- `/admin/login`
- `/admin/destinations`
- `/admin/sights`
- `/admin/experiences`
- `/admin/food-drink`
- `/admin/accommodation`
- `/admin/tours`
- `/admin/itineraries` and `/admin/itineraries/builder`
- `/admin/trips`, `/admin/trips/new`, `/admin/trips/[id]`
- `/admin/site`

Auth and utility

- `/login`
- `/auth/reset`
- `/auth/signin`, `/auth/signout`, `/auth/callback`, `/auth/reset/request` (handlers)
- `/ping` (health check)
- `/env-check` (env validation handler)
- `/blob-media/*` (blob proxy handler)
- `/sandbox/timeline`, `/test/geocode`, `/test/places` (internal tools)

API

- `/api/public/countries`
- `/api/public/places/photo`
- `/api/destinations` and `/api/destinations/[slug]`
- `/api/sights`, `/api/sights/destination/[slug]`, `/api/sights/destination/[slug]/[sight]`
- `/api/experiences`, `/api/experiences/destination/[slug]`, `/api/experiences/destination/[slug]/[experience]`
- `/api/tours`, `/api/tours/destination/[slug]`, `/api/tours/destination/[slug]/[tour]`
- `/api/accommodation` and `/api/accommodation/[slug]`
- `/api/day-itineraries`, `/api/day-itineraries/[id]`, `/api/day-itineraries/search`, `/api/day-itineraries/library`
- `/api/geo/regions`
- `/api/contact`
- `/api/upload`
- `/api/revalidate`
- `/api/auth/session`
- `/api/debug/visibility`
- `/api/admin/*` (admin data + upload + geo/meta endpoints)

## Migrations

- `scripts/migrations/2024-06-01-countries-fields.sql` adds optional `summary` and `hero_image` columns on `public.countries` plus an index on `name`. Apply this to surface country cards/hero content.
