import destinations from "@/data/locations";
import { notFound } from "next/navigation";
import EmblaCarousel from "@/components/EmblaCarousel";
import Image from "next/image";
import { fetchLocations, fetchLocationsBySlug } from "@/lib/supabaseRest";
import { resolveImageUrl } from "@/lib/imageUrl";
import Link from "next/link";
import RichText from "@/components/RichText";

export async function generateStaticParams() {
  try {
    const rows = await fetchLocations();
    return rows.map((d) => ({ slug: d.slug }));
  } catch {
    return destinations.map((d) => ({ slug: d.slug }));
  }
}

export default async function LocationsPage({ params }) {
  const { slug } = params;
  let destination = null;
  try {
    const row = await fetchLocationsBySlug(slug);
    if (row) {
      destination = {
        title: row.name,
        image: resolveImageUrl(row.hero_image || row.thumbnail_image),
        details: row.body_richtext || row.summary,
        credit: row.credit || null,
      };
    }
  } catch {}
  if (!destination) {
    destination = destinations.find((d) => d.slug === slug);
  }

  if (!destination) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {/* Title with black lines above and below */}
      <div className="border-t-2 border-black/10 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            {destination.title}
          </h1>
          <Link href="/locations" className="underline ml-4">
            Back
          </Link>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>

      {/* Responsive layout: image first on mobile, text underneath; text left & image right on desktop */}
      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        {/* Image: order first on mobile, second on desktop (so it sits on the right on larger screens) */}
        <div className="order-1 md:order-2">
          {Array.isArray(destination.images) &&
          destination.images.length > 0 ? (
            <EmblaCarousel
              images={destination.images}
              options={{ loop: true, align: "start" }}
              className="rounded-xl overflow-hidden"
              slideClass="h-[48vh] min-h-[320px]"
            />
          ) : (
            <Image
              src={destination.image}
              alt={destination.title}
              width={1200}
              height={800}
              className="w-full h-auto rounded-xl object-cover"
              priority={false}
            />
          )}
        </div>

        {/* Caption under image */}
        {destination.credit ? (
          <p className="mt-2 text-xs text-gray-500 text-right order-3 md:order-3">
            {destination.credit}
          </p>
        ) : null}

        {/* Text: order second on mobile (under image), first on desktop (left of image) */}
        <div className="order-2 md:order-1">
          <RichText value={destination.details} />
        </div>
      </section>
    </main>
  );
}
export const revalidate = 300;
