import { notFound } from "next/navigation";
import EmblaCarousel from "@/components/EmblaCarousel";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import {
  firstImageFromImages,
  imagesToGallery,
  resolveImageUrl,
} from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";
import RichTextReadOnly from "@/components/RichTextReadOnly";
import GygWidget from "@/components/GygWidget";
import OpeningTimesPublic from "@/components/OpeningTimesPublic";
import AdmissionPricesPublic from "@/components/AdmissionPricesPublic";
import { getSightBySlugPublic } from "@/lib/data/public/sights";
import { fmtJPY } from "@/lib/format";

export const revalidate = 300;
export const runtime = "nodejs";

export default async function SightBySlugPage(props) {
  const { slug } = (await props.params) || {};
  const { debug } = (await props.searchParams) || {};
  const result = await getSightBySlugPublic(slug);
  if (!result?.sight && !debug) notFound();

  const sight = result?.sight || null;
  const destination = result?.destination || null;
  const admissions = result?.admissions || [];
  const openingTimes = result?.openingTimes || null;

  const lat =
    typeof sight?.lat === "number"
      ? sight.lat
      : Number.parseFloat(String(sight?.lat ?? ""));
  const lng =
    typeof sight?.lng === "number"
      ? sight.lng
      : Number.parseFloat(String(sight?.lng ?? ""));
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
  const hero = resolveImageUrl(firstImageFromImages(sight?.images));
  const gallery = imagesToGallery(sight?.images ?? []).slice(1);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      {!sight && debug ? (
        <pre className="rounded-md border bg-muted p-3 text-xs overflow-x-auto">
          {JSON.stringify({ slug, result }, null, 2)}
        </pre>
      ) : null}

      <div className="border-t-2 border-border pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            {sight?.name || "Sight"}
          </h1>
          {destination?.slug ? (
            <Link
              href={`/sights/destination/${destination.slug}`}
              className="underline ml-4"
            >
              Back
            </Link>
          ) : (
            <Link href="/sights" className="underline ml-4">
              Back
            </Link>
          )}
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>

      {sight ? (
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 lg:gap-8 items-start">
          <div className="space-y-6">
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
                alt={sight.name}
                width={1200}
                height={800}
                className="w-full h-auto rounded-xl object-cover"
              />
            ) : null}

            <div className="space-y-4">
              {sight.summary ? (
                <p className="text-lg leading-relaxed">{sight.summary}</p>
              ) : null}
              {sight.body_richtext ? (
                <RichTextReadOnly value={sight.body_richtext} />
              ) : null}
              {hasCoordinates ? (
                <div className="overflow-hidden rounded-xl border">
                  <iframe
                    title={`Map of ${sight.name}`}
                    src={`https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                    loading="lazy"
                    allowFullScreen
                    className="h-64 w-full border-0"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            {sight.deeplink ? (
              <div className="flex justify-end">
                <a
                  href={sight.deeplink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 hover:opacity-90"
                >
                  {sight.provider && String(sight.provider).toLowerCase() === "gyg"
                    ? "Book on GetYourGuide"
                    : "Book Now"}
                </a>
              </div>
            ) : null}

            <div className="space-y-5">
              <OpeningTimesPublic openingTimes={openingTimes} />
              <AdmissionPricesPublic admissions={admissions} />
            </div>
          </div>
        </section>
      ) : null}

      {sight ? (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Popular tours</h2>
          <GygWidget tourId={sight.gyg_id} />
        </section>
      ) : null}

      {sight ? (
        <section className="mt-4">
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                {destination ? (
                  <span>
                    <span className="font-medium text-foreground">
                      Destination:
                    </span>{" "}
                      <Link
                      href={`/destination/${destination.slug}`}
                      className="underline"
                    >
                      {destination.name}
                    </Link>
                  </span>
                ) : null}
                {fmtJPY(sight.price_amount) ? (
                  <span>
                    <span className="font-medium text-foreground">Price:</span>{" "}
                    {fmtJPY(sight.price_amount)}
                  </span>
                ) : null}
                {sight.duration_minutes ? (
                  <span>
                    <span className="font-medium text-foreground">Duration:</span>{" "}
                    {sight.duration_minutes} min
                  </span>
                ) : null}
              </div>
              {Array.isArray(sight.tags) && sight.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sight.tags.map((t, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-xs"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </main>
  );
}
