import accommodation from "@/data/accommodation";
import { notFound } from "next/navigation";
import EmblaCarousel from "@/components/EmblaCarousel";
import Image from "next/image";
import {
  fetchAccommodations,
  fetchAccommodationBySlug,
} from "@/lib/supabaseRest";
import { resolveImageUrl } from "@/lib/imageUrl";
import Link from "next/link";
import RichText from "@/components/RichText";

export async function generateStaticParams() {
  try {
    const rows = await fetchAccommodations();
    return rows.map((a) => ({ slug: a.slug }));
  } catch {
    return accommodation.map((a) => ({ slug: a.slug }));
  }
}

export default async function AccommodationDetailPage({ params }) {
  const { slug } = params;
  let item = null;
  try {
    const row = await fetchAccommodationBySlug(slug);
    if (row) {
      const gallery = Array.isArray(row.images) ? row.images : [];
      item = {
        title: row.name,
        image: resolveImageUrl(row.hero_image || row.thumbnail_image),
        images: gallery.map((k) => resolveImageUrl(k)).filter(Boolean),
        details: row.description || row.summary,
        credit: row.credit || null,
      };
    }
  } catch {}
  if (!item) {
    item = accommodation.find((a) => a.slug === slug);
  }

  if (!item) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-black/10 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            {item.title}
          </h1>
          <Link href="/accommodation" className="underline ml-4">
            Back
          </Link>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <div className="order-1 md:order-2">
          {Array.isArray(item.images) && item.images.length > 0 ? (
            <EmblaCarousel
              images={item.images}
              options={{ loop: true, align: "start" }}
              className="rounded-xl overflow-hidden"
              slideClass="h-[48vh] min-h-[320px]"
            />
          ) : (
            <Image
              src={item.image}
              alt={item.title}
              width={1200}
              height={800}
              className="w-full h-auto rounded-xl object-cover"
            />
          )}
        </div>

        {/* Caption under image */}
        {item.credit ? (
          <p className="mt-2 text-xs text-gray-500 text-right order-3 md:order-3">
            {item.credit}
          </p>
        ) : null}

        <div className="order-2 md:order-1">
          <RichText value={item.details} />
        </div>
      </section>
    </main>
  );
}
export const revalidate = 900;
