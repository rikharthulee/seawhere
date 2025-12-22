// Destination detail page – fetches data by slug and renders details
import { notFound } from "next/navigation";
import EmblaCarousel from "@/components/EmblaCarousel";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import RichText from "@/components/RichText";
import {
  firstImageFromImages,
  imagesToGallery,
  resolveImageUrl,
} from "@/lib/imageUrl";
import GygWidget from "@/components/GygWidget";
import { getDestinationBySlugsPublic } from "@/lib/data/public/destinations";
import { getPublicDB } from "@/lib/supabase/public";

// ISR setting: revalidate page every 900 seconds (15 minutes)
export const revalidate = 300;
// Use Node.js runtime for this page
export const runtime = "nodejs";
// Server component for destination detail
export default async function DestinationPage(props) {
  const { country, destination } = (await props.params) || {};
  if (!country || !destination) notFound();

  const dst = await getDestinationBySlugsPublic(country, destination);
  if (!dst) notFound();

  const gallery = imagesToGallery(dst.images ?? []);
  const hero = gallery[0] || resolveImageUrl(firstImageFromImages(dst.images ?? []));
  const countryData = dst.countries || null;

  // Fetch sights for this destination (soft-fail if query errors)
  let sights = [];
  try {
    const db = getPublicDB();
    const { data, error } = await db
      .from("sights")
      .select(
        "id, name, slug, summary, description, tags, duration_minutes, destination_id"
      )
      .eq("destination_id", dst.id)
      .eq("status", "published")
      .order("name", { ascending: true });
    if (!error && Array.isArray(data)) {
      sights = data;
    }
  } catch {
    sights = [];
  }

  const sightHref = (s) =>
    s?.slug
      ? `/sights/${encodeURIComponent(country)}/${encodeURIComponent(
          destination
        )}/${encodeURIComponent(s.slug)}`
      : "#";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Page header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {countryData ? (
            <div className="text-sm text-muted-foreground mb-1">
              <Link href={`/countries/${countryData.slug}`} className="underline">
                {countryData.name}
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

      {/* Hero image or gallery + description (stacked, full width) */}
      <section className="mt-6 space-y-6">
        <div className="w-full">
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
              sizes="(min-width: 768px) 100vw, 100vw"
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
        <div className="w-full">
          {dst.body_richtext ? (
            <RichText value={dst.body_richtext} />
          ) : dst.summary ? (
            <RichText value={dst.summary} />
          ) : (
            <p className="text-muted-foreground">More details coming soon.</p>
          )}
        </div>
      </section>

      {/* Sights */}
      <section className="mt-10 space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold">Sights</h2>
          <p className="text-sm text-muted-foreground">{sights.length} places</p>
        </div>
        {sights.length === 0 ? (
          <div className="rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground">
            No sights added for this destination yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sights.map((sight) => (
              <Link
                key={sight.id}
                href={sightHref(sight)}
                className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{sight.name}</h3>
                    {sight.summary || sight.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {sight.summary || sight.description}
                      </p>
                    ) : null}
                    {Array.isArray(sight.tags) && sight.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {sight.tags.slice(0, 6).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {typeof sight.duration_minutes === "number" ? (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      ~{sight.duration_minutes}m
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
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
