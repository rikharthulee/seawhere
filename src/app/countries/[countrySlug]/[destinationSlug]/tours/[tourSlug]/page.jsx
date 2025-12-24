import { notFound } from "next/navigation";
import EmblaCarousel from "@/components/EmblaCarousel";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  firstImageFromImages,
  imagesToGallery,
  resolveImageUrl,
} from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";
import RichTextReadOnly from "@/components/RichTextReadOnly";
import { getTourByDestinationSlugsPublic } from "@/lib/data/public/tours";
import { fmtJPY } from "@/lib/format";
import GygWidget from "@/components/GygWidget";
import ContentViewTracker from "@/components/ContentViewTracker";
import {
  countryPath,
  destinationPath,
  destinationSectionPath,
} from "@/lib/routes";

export const revalidate = 300;
export const runtime = "nodejs";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function fmtDays(days) {
  if (!Array.isArray(days) || days.length === 0) return "";
  return days
    .map((d) => DAY_LABELS[d] || "")
    .filter(Boolean)
    .join(", ");
}

export async function generateMetadata(props) {
  const { countrySlug, destinationSlug, tourSlug } = (await props.params) || {};
  const result = await getTourByDestinationSlugsPublic({
    countrySlug,
    destinationSlug,
    tourSlug,
  });
  if (!result?.tour || !result?.destination) return {};
  const countryName = result.destination?.countries?.name || "";
  const destinationName = result.destination?.name || "";
  const title = countryName
    ? `${result.tour.name} | ${destinationName}, ${countryName} | Seawhere`
    : `${result.tour.name} | ${destinationName} | Seawhere`;
  return {
    title,
    description:
      result.tour.summary ||
      `Book ${result.tour.name} in ${destinationName}.`,
  };
}

export default async function TourDetailBySlugPage(props) {
  const { countrySlug, destinationSlug, tourSlug } = (await props.params) || {};
  const result = await getTourByDestinationSlugsPublic({
    countrySlug,
    destinationSlug,
    tourSlug,
  });
  if (!result?.tour || !result?.destination) notFound();
  const { tour: p, destination: dest } = result;

  const gallery = imagesToGallery(p.images ?? []);
  const hero = gallery[0] || resolveImageUrl(firstImageFromImages(p.images ?? []));
  const slides = gallery.length > 0 ? gallery : hero ? [hero] : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {p?.id ? <ContentViewTracker type="tour" id={p.id} /> : null}
      <Breadcrumbs
        items={[
          { label: "Countries", href: countryPath() },
          {
            label: dest?.countries?.name || "Country",
            href: countryPath(countrySlug),
          },
          {
            label: dest?.name || "Destination",
            href: destinationPath(countrySlug, destinationSlug),
          },
          {
            label: "Tours",
            href: destinationSectionPath(countrySlug, destinationSlug, "tours"),
          },
          { label: p.name },
        ]}
      />

      <div className="flex items-center justify-between pt-2">
        <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
          {p.name}
        </h1>
        <Link
          href={destinationSectionPath(countrySlug, destinationSlug, "tours")}
          className="underline ml-4"
        >
          Back
        </Link>
      </div>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <div className="md:col-span-2">
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
        </div>

        <div className="md:col-span-2">
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                  {dest ? (
                    <span>
                      <span className="font-medium text-foreground">
                        Destination:
                      </span>{" "}
                      <Link
                        href={destinationPath(countrySlug, destinationSlug)}
                        className="underline"
                      >
                        {dest.name}
                      </Link>
                    </span>
                  ) : null}
                  {fmtJPY(p.price_amount) ? (
                    <span>
                      <span className="font-medium text-foreground">
                        Price:
                      </span>{" "}
                      {fmtJPY(p.price_amount)}
                    </span>
                  ) : null}
                  {p.duration_minutes ? (
                    <span>
                      <span className="font-medium text-foreground">
                        Duration:
                      </span>{" "}
                      {p.duration_minutes} min
                    </span>
                  ) : null}
                  {p.provider ? (
                    <span>
                      <span className="font-medium text-foreground">
                        Provider:
                      </span>{" "}
                      {p.provider}
                    </span>
                  ) : null}
                </div>
                {p.deeplink ? (
                  <a
                    href={p.deeplink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 hover:opacity-90"
                  >
                    Book Now
                  </a>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {p.summary ? (
            <p className="text-lg leading-relaxed mb-3">{p.summary}</p>
          ) : null}
          {p.body_richtext ? (
            <RichTextReadOnly value={p.body_richtext} />
          ) : null}
          {Array.isArray(p.tags) && p.tags.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {p.tags.map((t, i) => (
                <span
                  key={i}
                  className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
          {p.available_days ? (
            <div className="text-sm text-muted-foreground">
              Runs on: {fmtDays(p.available_days)}
            </div>
          ) : null}
        </div>
      </section>

      {p ? (
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Popular tours</h2>
          <GygWidget tourId={p.gyg_id} />
        </section>
      ) : null}
    </main>
  );
}
