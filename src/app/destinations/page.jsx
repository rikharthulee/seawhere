import Destinations from "@/components/Destinations";
import { getPublishedDestinations } from "@/lib/data/destinations";

export default async function DestinationsPage() {
  const rows = await getPublishedDestinations();
  const items = rows.map((r) => ({
    slug: r.slug,
    title: r.name,
    images: r.images, // do not coerce; if missing/invalid this should error upstream
    credit: r.credit,
  }));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Destinations items={items} />
    </main>
  );
}

export const revalidate = 300;
export const runtime = "nodejs";
