import { notFound } from "next/navigation";
import Link from "next/link";
import EmblaCarousel from "@/components/EmblaCarousel";
import SafeImage from "@/components/SafeImage";
import Breadcrumbs from "@/components/Breadcrumbs";
import RichText from "@/components/RichText";
import { Card, CardContent } from "@/components/ui/card";
import ContentViewTracker from "@/components/ContentViewTracker";
import {
  firstImageFromImages,
  imagesToGallery,
  resolveImageUrl,
} from "@/lib/imageUrl";
import { getAccommodationByDestinationSlugsPublic } from "@/lib/data/public/accommodation";
import {
  countryPath,
  destinationPath,
  destinationSectionPath,
} from "@/lib/routes";

export const revalidate = 300;
export const runtime = "nodejs";

export async function generateMetadata(props) {
  const { countrySlug, destinationSlug, placeSlug } = (await props.params) || {};
  const result = await getAccommodationByDestinationSlugsPublic({
    countrySlug,
    destinationSlug,
    placeSlug,
  });
  if (!result?.place || !result?.destination) return {};
  const countryName = result.destination?.countries?.name || "";
  const destinationName = result.destination?.name || "";
  const title = countryName
    ? `${result.place.name} | ${destinationName}, ${countryName} | Seawhere`
    : `${result.place.name} | ${destinationName} | Seawhere`;
  return {
    title,
    description:
      result.place.summary ||
      `Stay at ${result.place.name} in ${destinationName}.`,
  };
}

export default async function AccommodationDetailPage(props) {
  const { countrySlug, destinationSlug, placeSlug } = (await props.params) || {};
  if (!placeSlug) notFound();

  const result = await getAccommodationByDestinationSlugsPublic({
    countrySlug,
    destinationSlug,
    placeSlug,
  });
  if (!result?.place) notFound();

  const row = result.place;
  const destination = result.destination || null;

  const googlePhotos = Array.isArray(row.google_photos) ? row.google_photos : [];
  const googleSlides = googlePhotos
    .map((photo) => {
      if (!photo?.name) return null;
      const params = new URLSearchParams({
        photoName: photo.name,
        maxWidthPx: "1600",
        maxHeightPx: "1200",
      });
      return `/api/public/places/photo?${params.toString()}`;
    })
    .filter(Boolean);
  const gallery = imagesToGallery(row.images ?? []);
  const hero = gallery[0] || resolveImageUrl(firstImageFromImages(row.images ?? []));
  const slides = googleSlides.length > 0 ? googleSlides : gallery.length > 0 ? gallery : hero ? [hero] : [];
  const lat =
    typeof row?.lat === "number"
      ? row.lat
      : Number.parseFloat(String(row?.lat ?? ""));
  const lng =
    typeof row?.lng === "number"
      ? row.lng
      : Number.parseFloat(String(row?.lng ?? ""));
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
  const addressValue = (() => {
    if (row?.google_formatted_address) return row.google_formatted_address;
    if (row?.geocoded_address) return row.geocoded_address;
    if (!row?.address) return "";
    if (typeof row.address === "string") {
      try {
        const parsed = JSON.parse(row.address);
        if (parsed?.formatted_address) return parsed.formatted_address;
      } catch {}
      return row.address;
    }
    if (row.address?.formatted_address) return row.address.formatted_address;
    return JSON.stringify(row.address);
  })();
  const photoAttributions = Array.from(
    new Map(
      googlePhotos
        .flatMap((photo) => photo?.authorAttributions || [])
        .filter((attr) => attr?.displayName)
        .map((attr) => [attr.displayName, attr])
    ).values()
  );
  const starCount = Number.isFinite(row?.rating)
    ? Math.max(0, Math.min(5, Math.round(row.rating)))
    : 0;
  const stars = starCount > 0 ? "★".repeat(starCount) : "";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {row?.id ? <ContentViewTracker type="accommodation" id={row.id} /> : null}
      <Breadcrumbs
        items={[
          { label: "Countries", href: countryPath() },
          {
            label: destination?.countries?.name || "Country",
            href: countryPath(countrySlug),
          },
          {
            label: destination?.name || "Destination",
            href: destinationPath(countrySlug, destinationSlug),
          },
          {
            label: "Accommodation",
            href: destinationSectionPath(
              countrySlug,
              destinationSlug,
              "accommodation"
            ),
          },
          { label: row.name },
        ]}
      />

      <div className="flex items-center justify-between pt-2">
        <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
          {row.name}
        </h1>
        <Link
          href={destinationSectionPath(
            countrySlug,
            destinationSlug,
            "accommodation"
          )}
          className="underline ml-4"
        >
          Back
        </Link>
      </div>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <div className="order-1 md:order-2">
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
          {photoAttributions.length > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Photo credits:{" "}
              {photoAttributions.map((attr, idx) => (
                <span key={`${attr.displayName}-${idx}`}>
                  {attr.uri ? (
                    <a
                      href={attr.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {attr.displayName}
                    </a>
                  ) : (
                    attr.displayName
                  )}
                  {idx < photoAttributions.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          ) : null}
        </div>

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

      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
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
                {stars}
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

      {addressValue || hasCoordinates ? (
        <section className="mt-6 space-y-3">
          <h2 className="text-xl font-semibold">Location</h2>
          {addressValue ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                addressValue
              )}`}
              target="_blank"
              rel="noreferrer"
              className="block rounded border bg-muted/50 p-3 text-sm text-foreground/90 underline hover:bg-muted"
            >
              {addressValue}
            </a>
          ) : null}
          {hasCoordinates ? (
            <div className="overflow-hidden rounded-xl border">
              <iframe
                title={`Map of ${row.name}`}
                src={`https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                loading="lazy"
                allowFullScreen
                className="h-64 w-full border-0"
              />
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
