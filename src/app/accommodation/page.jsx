// Accommodation listing page – fetches published accommodation rows and renders them

// Import component and data helper
import Accommodation from "@/components/Accommodation";
import { listPublishedAccommodation } from "@/lib/data/public/accommodation";

// Page component (async server component)
export default async function AccommodationPage() {
  const rows = await listPublishedAccommodation();
  const items = Array.isArray(rows)
    ? rows.map((r) => ({
        slug: r.slug,
        title: r.name,
        images: Array.isArray(r.images) ? r.images : [],
        credit: r.credit || null,
      }))
    : [];

  // Render the Accommodation component with the fetched items
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Accommodation items={items} />
    </main>
  );
}

// Next.js options: ISR (revalidate every 900s), run on Node runtime
export const revalidate = 300;
export const runtime = "nodejs";
