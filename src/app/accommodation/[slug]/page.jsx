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
import { getAccommodationBySlugPublic } from "@/lib/data/public/accommodation";

// Accommodation detail page – fetches data by slug and renders details

// ISR setting: revalidate this page every 900 seconds (15 minutes)
export const revalidate = 900;
export const runtime = "nodejs";

// Server component for accommodation detail
export default async function AccommodationDetailPage(props) {
  // Extract slug param, fetch accommodation data by slug via API
  const { slug } = (await props.params) || {};
  if (!slug) notFound();

  const row = await getAccommodationBySlugPublic(slug);
  if (!row) notFound();

  const hero = resolveImageUrl(firstImageFromImages(row.images ?? []));
  const gallery = imagesToGallery(row.images ?? []).slice(1);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Page header */}
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            {row.name}
          </h1>
          <Link href="/accommodation" className="underline ml-4">
            Back
          </Link>
        </div>
        <div className="border-b-2 border-border mt-3" />
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
              alt={row.name}
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
          {row.description ? (
            <RichText value={row.description} />
          ) : row.summary ? (
            <RichText value={row.summary} />
          ) : (
            <p className="text-muted-foreground">More details coming soon.</p>
          )}
        </div>
      </section>

      {/* Overview card and Links card */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
        {/* Overview card */}
        <Card>
          <CardContent className="p-3 space-y-1">
            <div className="font-medium text-foreground">Overview</div>
            {row.price_band ? (
              <div>
                <span className="font-medium text-foreground/80">
                  Price band:
                </span>{" "}
                {row.price_band}
              </div>
            ) : null}
            {typeof row.rating === "number" ? (
              <div>
                <span className="font-medium text-foreground/80">Rating:</span>{" "}
                {row.rating.toFixed(1)} / 5
              </div>
            ) : null}
            {row.lat ?? row.lng ? (
              <div>
                <span className="font-medium text-foreground/80">Lat/Lng:</span>{" "}
                {row.lat ?? "—"}, {row.lng ?? "—"}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Links card */}
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="font-medium text-foreground">Links</div>
            <div className="flex flex-wrap gap-2">
              {row.website_url ? (
                <a
                  href={row.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border px-3 py-1 hover:bg-accent transition-colors"
                >
                  Website
                </a>
              ) : null}
              {row.affiliate_url ? (
                <a
                  href={row.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-blue-600 text-white px-3 py-1 hover:bg-blue-700 transition-colors"
                >
                  Book
                </a>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Address block */}
      {row.address ? (
        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Address</h2>
          <pre className="rounded border bg-muted p-3 text-xs overflow-auto text-foreground/90">
            {typeof row.address === "string"
              ? row.address
              : JSON.stringify(row.address, null, 2)}
          </pre>
        </section>
      ) : null}
    </main>
  );
}
