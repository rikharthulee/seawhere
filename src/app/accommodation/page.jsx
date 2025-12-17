// Accommodation listing page – fetches published accommodation rows and renders them

// Import component and data helper
import Accommodation from "@/components/Accommodation";
import { listPublishedAccommodation } from "@/lib/data/public/accommodation";
import ExploreFilters from "@/components/ExploreFilters";
import { listCountriesPublic } from "@/lib/data/public/geo";
import { listPublishedDestinations } from "@/lib/data/public/destinations";

// Page component (async server component)
export default async function AccommodationPage() {
  const rows = await listPublishedAccommodation();
  const [countries, destinations] = await Promise.all([
    listCountriesPublic(),
    listPublishedDestinations(),
  ]);
  const items = Array.isArray(rows)
    ? rows.map((r) => ({
        slug: r.slug,
        title: r.name,
        summary: r.summary || null,
        images: Array.isArray(r.images) ? r.images : [],
      }))
    : [];

  // Render the Accommodation component with the fetched items
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <ExploreFilters
        countries={countries}
        destinations={destinations}
        tags={["luxury", "boutique", "budget", "family", "beach"]}
      />
      <div className="mt-8">
        <Accommodation items={items} />
      </div>
    </main>
  );
}

// Next.js options: ISR (revalidate every 900s), run on Node runtime
export const revalidate = 300;
export const runtime = "nodejs";
