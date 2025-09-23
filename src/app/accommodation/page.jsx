import Accommodation from "@/components/Accommodation";
import { getPublishedAccommodation } from "@/lib/data/accommodation";

export default async function AccommodationPage() {
  let items = [];
  try {
    const rows = await getPublishedAccommodation();
    items = rows.map((r) => ({
      slug: r.slug,
      title: r.name,
      images: Array.isArray(r.images) ? r.images : [],
      credit: r.credit || null,
    }));
  } catch {}
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <Accommodation items={items} />
    </main>
  );
}
export const revalidate = 900;
export const runtime = "nodejs";
