This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Project Conventions

- Dynamic route params in this project must be awaited in the App Router. Example:

  ```js
  // Good
  export default async function Page({ params }) {
    const { slug } = await params;
    // ...
  }

  // Avoid
  export default async function Page({ params }) {
    const { slug } = params; // may throw in this setup
  }
  ```

- Public destination pages should read published rows only and avoid caching 404s during content entry. Use `revalidate = 0` and filter `status = 'published'` when appropriate.

## Excursion Builder Overview

This project includes an admin Excursion Builder and public Excursion pages. Below are the key files and their roles end‑to‑end.

- `src/app/admin/excursions/builder/page.jsx`
  - Admin route that renders the builder UI. Thin wrapper around the component.

- `src/components/admin/ExcursionBuilder.jsx`
  - Main builder UI. Create/edit an excursion’s core fields; add/remove/reorder items; add transport; live preview; save/delete.
  - Calls admin APIs to POST/PUT/DELETE excursions and their items and uses `GET /api/excursions/search` to find sights/experiences/tours to add.

- `src/app/admin/excursions/page.jsx`
  - Admin index page listing excursions (draft/published) with links to the builder and public view.

- `src/app/api/admin/excursions/route.js`
  - POST: create a new excursion row and optional items.
  - GET: list excursions for the admin index (name/status/updated_at filters).

- `src/app/api/admin/excursions/[id]/route.js`
  - GET: load a single excursion with its `excursion_items` (sorted).
  - PUT: update the excursion and replace its `excursion_items` in one go.
  - DELETE: delete excursion and its items.

- `src/app/api/excursions/search/route.js`
  - Builder search endpoint to look up selectable entities (sights/experiences/tours) by text query.

- `src/lib/data/public/excursions.js`
  - Public SSR helpers (anon). Provide two strict helpers, not mixed:
    - `getCuratedExcursionBySlugPublic(slug)` for public pages
    - `getCuratedExcursionByIdPublic(id)` for internal use
  - Both hydrate `excursion_items` by resolving referenced entities via `eq('id', uuid)`.

- `src/app/excursions/[slug]/page.jsx`
  - Public excursion detail page (slug-based). Interleaves hydrated items and transport by `sort_order`. Renders name, thumbnail, summary, and an “Opening times” link when available. Accepts `?debug=1` to show a small debug block when an entity is not visible via RLS.

Data flow summary
- Admin builder → admin APIs → writes `excursions` + `excursion_items`.
- Public page → public helper → reads published `excursions` + `excursion_items`, resolves refs to `sights/experiences/tours`, and renders the flow.

RLS and visibility (production)
- Public pages use the anon Supabase client and require policies that allow `SELECT` when the parent excursion is published.
  - `excursions`: anon `SELECT` where `status = 'published'`.
  - `excursion_items`: anon `SELECT` where an associated excursion is published.
  - `sights/experiences/tours`: anon `SELECT` for published rows (or “referenced by a published excursion”).
