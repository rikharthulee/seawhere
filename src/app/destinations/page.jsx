// Destinations listing page – fetches published destination rows and renders them
// Import component and data helper
import Destinations from "@/components/Destinations";
import { getPublishedDestinations } from "@/lib/data/destinations";

// Page component (async server component)
export default async function DestinationsPage() {
  let items = [];
  try {
    // Fetch published destination rows from the database
    const rows = await getPublishedDestinations();
    items = rows.map((r) => ({
      // Normalize each row into props expected by the Destinations component
      slug: r.slug,
      title: r.name,
      images: Array.isArray(r.images) ? r.images : [],
      credit: r.credit || null,
    }));
  } catch (e) {
    console.error("getPublishedDestinations failed:", e);
  }

  // Render the Destinations component with the fetched items
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Destinations items={items} />
    </main>
  );
}

// Next.js options: ISR (revalidate every 900s), run on Node runtime
export const revalidate = 900;
export const runtime = "nodejs";
