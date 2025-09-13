import Accommodation from "@/components/Accommodation";
import { getPublishedAccommodation } from "@/lib/data/accommodation";
import { resolveImageUrl } from "@/lib/imageUrl";

export default async function AccommodationPage() {
  let items = [];
  try {
    const rows = await getPublishedAccommodation();
    items = rows.map((r) => ({
      slug: r.slug,
      title: r.name,
      image: resolveImageUrl(r.thumbnail_image || r.hero_image),
      credit: r.credit || null,
    }));
  } catch {}
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Accommodation items={items} />
    </main>
  );
}
export const revalidate = 900;
export const runtime = 'nodejs';
