// Destinations listing page – fetches published destination rows and renders them
// Import component and data helper
import Destinations from "@/components/Destinations";
import { listPublishedDestinations } from "@/lib/data/public/destinations";
import ExploreFilters from "@/components/ExploreFilters";
import { listCountriesPublic } from "@/lib/data/public/geo";

// Page component (async server component)
export default async function DestinationsPage() {
  const rows = await listPublishedDestinations();
  const countries = await listCountriesPublic();
  const items = Array.isArray(rows)
    ? rows.map((r) => ({
        slug: r.slug,
        title: r.name,
        countries: r.countries || null,
        country_slug: r?.countries?.slug || null,
        images: Array.isArray(r.images) ? r.images : [],
        credit: r.credit || null,
      }))
    : [];

  // Render the Destinations component with the fetched items
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <ExploreFilters
        countries={countries}
        destinations={rows}
        tags={["beach", "city", "mountains", "islands"]}
      />
      <div className="mt-8">
        <Destinations items={items} />
      </div>
    </main>
  );
}

// Next.js options: ISR (revalidate every 900s), run on Node runtime
export const revalidate = 300;
export const runtime = "nodejs";
