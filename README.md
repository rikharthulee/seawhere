# Seawhere

Next.js 15 + Supabase app for building and browsing Southeast Asia itineraries. The stack uses the App Router with SSR for public pages and a client-side admin workspace for editing content.

## Environment

Required env vars for Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the app.

## Conventions

- Await App Router params: `const { slug } = await params;`
- Public pages should filter `status = 'published'` and avoid caching empty states during content entry.
- Admin APIs run on the Node runtime and require an authenticated session.

## Feature map

- Countries → destinations → points of interest (sights, experiences, tours, food & drink, accommodation).
- Excursions are curated bundles of items plus transport legs.
- Admin tooling lives under `/admin/*`; public browsing under `/country/[slug]`, `/destination/[slug]`, `/sights`, `/experiences`, `/tours`, etc.
