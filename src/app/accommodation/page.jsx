// Accommodation listing page – fetches published accommodation rows and renders them

// Import component and data helper
import Accommodation from "@/components/Accommodation";
import { getPublishedAccommodation } from "@/lib/data/accommodation";

// Page component (async server component)
export default async function AccommodationPage() {
  let items = [];
  try {
    // Fetch published accommodation rows from the database
    const rows = await getPublishedAccommodation();
    items = rows.map((r) => ({
      // Normalize each row into props expected by the Accommodation component
      slug: r.slug,
      title: r.name,
      images: Array.isArray(r.images) ? r.images : [],
      credit: r.credit || null,
    }));
  } catch (e) {
    console.error("getPublishedDestinations failed:", e);
  }

  // Render the Accommodation component with the fetched items
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Accommodation items={items} />
    </main>
  );
}

// Next.js options: ISR (revalidate every 900s), run on Node runtime
export const revalidate = 900;
export const runtime = "nodejs";
