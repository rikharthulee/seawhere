import Destinations from "@/components/Destinations";
import { getPublishedDestinations } from "@/lib/data/destinations";

export default async function DestinationsPage() {
  let items = [];
  try {
    const rows = await getPublishedDestinations();
    items = rows.map((r) => ({
      slug: r.slug,
      title: r.name,
      images: Array.isArray(r.images) ? r.images : [],
      credit: r.credit || null,
    }));
  } catch (e) {
    // ignore; component has internal fallback dataset if needed
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Destinations items={items} />
    </main>
  );
}

export const revalidate = 300;
export const runtime = "nodejs";
