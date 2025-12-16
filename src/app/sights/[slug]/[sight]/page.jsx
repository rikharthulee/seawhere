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
import { getSightBySlugsPublic } from "@/lib/data/public/sights";
import { fmtJPY } from "@/lib/format";

export const revalidate = 300;
export const runtime = "nodejs";

export default async function SightDetailBySlugPage(props) {
  const { slug, sight } = (await props.params) || {};
  const r = await getSightBySlugsPublic(slug, sight);
  if (!r?.sight || !r?.destination) notFound();
  const {
    sight: p,
    destination: dest,
    admissions = [],
    openingTimes = null,
  } = r;
  const lat =
    typeof p.lat === "number" ? p.lat : Number.parseFloat(String(p.lat ?? ""));
  const lng =
    typeof p.lng === "number" ? p.lng : Number.parseFloat(String(p.lng ?? ""));
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
  const gallery = imagesToGallery(p?.images ?? []);
  const hero = gallery[0] || resolveImageUrl(firstImageFromImages(p?.images));
  const slides = gallery.length > 0 ? gallery : hero ? [hero] : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
          {p.name}
        </h1>
        <Link href={`/sights/${dest.slug}`} className="underline ml-4">
          Back
        </Link>
      </div>

      <section className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 lg:gap-8 items-start">
        <div className="space-y-6">
          {slides.length > 1 ? (
            <EmblaCarousel
              images={slides}
              options={{ loop: true, align: "start" }}
              className="rounded-xl overflow-hidden"
              slideClass="h-[48vh] min-h-[320px]"
            />
          ) : slides.length === 1 ? (
            <SafeImage
              src={slides[0]}
              alt={p.name}
              width={1200}
              height={800}
              className="w-full h-auto rounded-xl object-cover"
            />
          ) : null}
          ) : null}

          <div className="space-y-4">
            {p.summary ? (
              <p className="text-lg leading-relaxed">{p.summary}</p>
            ) : null}
            {p.body_richtext ? (
              <RichTextReadOnly value={p.body_richtext} />
            ) : null}
            {hasCoordinates ? (
              <div className="overflow-hidden rounded-xl border">
                <iframe
                  title={`Map of ${p.name}`}
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
          {p.deeplink ? (
            <div className="flex justify-end">
              <a
                href={p.deeplink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 hover:opacity-90"
              >
                {p.provider && String(p.provider).toLowerCase() === "gyg"
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

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Popular tours</h2>
        <GygWidget tourId={p.gyg_id} />
      </section>

      <section className="mt-10">
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
              {dest ? (
              <span>
                <span className="font-medium text-foreground">
                  Destination:
                </span>{" "}
                <Link
                    href={`/destinations/${dest.slug}`}
                    className="underline"
                  >
                    {dest.name}
                  </Link>
                </span>
              ) : null}
              {fmtJPY(p.price_amount) ? (
                <span>
                  <span className="font-medium text-foreground">Price:</span>{" "}
                  {fmtJPY(p.price_amount)}
                </span>
              ) : null}
              {p.duration_minutes ? (
                <span>
                  <span className="font-medium text-foreground">Duration:</span>{" "}
                  {p.duration_minutes} min
                </span>
              ) : null}
            </div>
            {Array.isArray(p.tags) && p.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {p.tags.map((t, i) => (
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
    </main>
  );
}
