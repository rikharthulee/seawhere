import { notFound } from "next/navigation";
import Link from "next/link";
import EmblaCarousel from "@/components/EmblaCarousel";
import SafeImage from "@/components/SafeImage";
import Breadcrumbs from "@/components/Breadcrumbs";
import ContentViewTracker from "@/components/ContentViewTracker";
import RichText from "@/components/RichText";
import { Card, CardContent } from "@/components/ui/card";
import {
  firstImageFromImages,
  imagesToGallery,
  resolveImageUrl,
} from "@/lib/imageUrl";
import { getFoodDrinkByDestinationSlugsPublic } from "@/lib/data/public/food-drink";
import {
  countryPath,
  destinationPath,
  destinationSectionPath,
} from "@/lib/routes";

export const revalidate = 300;
export const runtime = "nodejs";

export async function generateMetadata(props) {
  const { countrySlug, destinationSlug, placeSlug } = (await props.params) || {};
  const result = await getFoodDrinkByDestinationSlugsPublic({
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
      result.place.description ||
      `Find ${result.place.name} in ${destinationName}.`,
  };
}

export default async function FoodDrinkDetailPage(props) {
  const { countrySlug, destinationSlug, placeSlug } = (await props.params) || {};
  if (!placeSlug) notFound();

  const result = await getFoodDrinkByDestinationSlugsPublic({
    countrySlug,
    destinationSlug,
    placeSlug,
  });
  if (!result?.place) notFound();

  const row = result.place;
  const destination = result.destination || null;
  const hero = resolveImageUrl(firstImageFromImages(row.images ?? []));
  const gallery = imagesToGallery(row.images ?? []);
  const slides = gallery.length > 0 ? gallery : hero ? [hero] : [];
  const lat =
    typeof row?.lat === "number"
      ? row.lat
      : Number.parseFloat(String(row?.lat ?? ""));
  const lng =
    typeof row?.lng === "number"
      ? row.lng
      : Number.parseFloat(String(row?.lng ?? ""));
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {row?.id ? (
        <ContentViewTracker type="food_drink" id={row.id} />
      ) : null}
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
            label: "Food & Drink",
            href: destinationSectionPath(
              countrySlug,
              destinationSlug,
              "food-drink"
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
            "food-drink"
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
        </div>

        <div className="order-2 md:order-1">
          {row.description ? (
            <RichText value={row.description} />
          ) : (
            <p className="text-muted-foreground">More details coming soon.</p>
          )}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
        <Card>
          <CardContent className="p-3 space-y-1">
            <div className="font-medium text-foreground">Overview</div>
            {row.type ? (
              <div>
                <span className="font-medium text-foreground/80">Type:</span>{" "}
                {String(row.type)}
              </div>
            ) : null}
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="font-medium text-foreground">Links</div>
            <div className="flex flex-wrap gap-2">
              {row.booking_url ? (
                <a
                  href={row.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border px-3 py-1 hover:bg-accent transition-colors"
                >
                  Book / Reserve
                </a>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>

      {row.address || hasCoordinates ? (
        <section className="mt-6 space-y-3">
          <h2 className="text-xl font-semibold">Location</h2>
          {row.address ? (
            <div className="rounded border bg-muted/50 p-3 text-sm text-foreground/90">
              {row.address}
            </div>
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
