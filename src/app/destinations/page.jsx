// Destinations listing page – fetches published destination rows and renders them
// Import component and data helper
import Destinations from "@/components/Destinations";
import { listPublishedDestinations } from "@/lib/data/public/destinations";

// Page component (async server component)
export default async function DestinationsPage() {
  const rows = await listPublishedDestinations();
  const items = Array.isArray(rows)
    ? rows.map((r) => ({
        slug: r.slug,
        title: r.name,
        images: Array.isArray(r.images) ? r.images : [],
        credit: r.credit || null,
      }))
    : [];

  // Render the Destinations component with the fetched items
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Destinations items={items} />
    </main>
  );
}

// Next.js options: ISR (revalidate every 900s), run on Node runtime
export const revalidate = 300;
export const runtime = "nodejs";
