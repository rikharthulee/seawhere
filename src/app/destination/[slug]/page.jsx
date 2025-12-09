// Destination detail page – fetches data by slug and renders details
import { notFound } from "next/navigation";
import EmblaCarousel from "@/components/EmblaCarousel";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import RichText from "@/components/RichText";
import { Card, CardContent } from "@/components/ui/card";
import {
  firstImageFromImages,
  imagesToGallery,
  resolveImageUrl,
} from "@/lib/imageUrl";
import GygWidget from "@/components/GygWidget";
import { getDestinationBySlugPublic } from "@/lib/data/public/destinations";

// ISR setting: revalidate page every 900 seconds (15 minutes)
export const revalidate = 300;
// Use Node.js runtime for this page
export const runtime = "nodejs";
// Server component for destination detail
export default async function DestinationPage(props) {
  // Extract slug from route params, fetch destination row via API, resolve hero and gallery images
  const { slug } = (await props.params) || {};
  if (!slug) notFound();

  const dst = await getDestinationBySlugPublic(slug);
  if (!dst) notFound();

  const hero = resolveImageUrl(firstImageFromImages(dst.images ?? []));
  const gallery = imagesToGallery(dst.images ?? []).slice(1);
  const country = dst.countries || null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          {country ? (
            <div className="text-sm text-muted-foreground mb-1">
              <Link href={`/country/${country.slug}`} className="underline">
                {country.name}
              </Link>
            </div>
          ) : null}
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            {dst.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/destinations" className="underline text-sm">
            Destinations
          </Link>
          <Link href="/countries" className="underline text-sm">
            Countries
          </Link>
        </div>
      </div>

      {/* Hero image or gallery */}
      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <div className="order-1 md:order-2">
          {gallery.length > 0 ? (
            <EmblaCarousel
              images={gallery}
              options={{ loop: true, align: "start" }}
              className="rounded-xl overflow-hidden"
              slideClass="h-[48vh] min-h-[320px]"
            />
          ) : hero ? (
            <SafeImage
              src={hero}
              alt={dst.name}
              width={1200}
              height={800}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="w-full h-auto rounded-xl object-cover"
              priority={false}
            />
          ) : (
            <div className="flex items-center justify-center h-64 bg-muted rounded-xl">
              <span className="text-muted-foreground">No image available</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="order-2 md:order-1">
          {dst.body_richtext ? (
            <RichText value={dst.body_richtext} />
          ) : dst.summary ? (
            <RichText value={dst.summary} />
          ) : (
            <p className="text-muted-foreground">More details coming soon.</p>
          )}
        </div>
      </section>

      {/* GYG widget */}
      {dst.gyg_location_id ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-2">Popular tours</h2>
          <GygWidget locationId={dst.gyg_location_id} />
        </section>
      ) : null}
    </main>
  );
}
