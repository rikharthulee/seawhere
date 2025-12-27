import { notFound } from "next/navigation";
import Link from "next/link";
import EmblaCarousel from "@/components/EmblaCarousel";
import SafeImage from "@/components/SafeImage";
import RichText from "@/components/RichText";
import Breadcrumbs from "@/components/Breadcrumbs";
import ContentViewTracker from "@/components/ContentViewTracker";
import PopularRightNow from "@/components/PopularRightNow";
import { Card } from "@/components/ui/card";
import {
  firstImageFromImages,
  imagesToGallery,
  resolveImageUrl,
} from "@/lib/imageUrl";
import { getDestinationBySlugsPublic } from "@/lib/data/public/destinations";
import { getPublicDB } from "@/lib/supabase/public";
import {
  countryPath,
  destinationItemPath,
  destinationPath,
  destinationSectionPath,
} from "@/lib/routes";

export const revalidate = 300;
export const runtime = "nodejs";

const INTERESTS = [
  { label: "Temples", query: "temples" },
  { label: "Waterfalls", query: "waterfalls" },
  { label: "Beaches", query: "beaches" },
  { label: "Night markets", query: "night markets" },
  { label: "Adventure", query: "adventure" },
  { label: "Wellness", query: "wellness" },
  { label: "Cafes", query: "cafes" },
];

async function fetchSectionPreview(destinationId, table, columns, limit = 3) {
  const db = getPublicDB();
  const { data, error } = await db
    .from(table)
    .select(columns)
    .eq("destination_id", destinationId)
    .eq("status", "published")
    .order("name", { ascending: true })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}

export async function generateMetadata(props) {
  const { countrySlug, destinationSlug } = (await props.params) || {};
  const dst = await getDestinationBySlugsPublic(countrySlug, destinationSlug);
  if (!dst) return {};
  const countryName = dst?.countries?.name || "";
  const title = countryName
    ? `${dst.name}, ${countryName} | Seawhere`
    : `${dst.name} | Seawhere`;
  return {
    title,
    description: dst.summary || `Plan your trip to ${dst.name}.`,
  };
}

export default async function DestinationHubPage(props) {
  const { countrySlug, destinationSlug } = (await props.params) || {};
  if (!countrySlug || !destinationSlug) notFound();

  const dst = await getDestinationBySlugsPublic(countrySlug, destinationSlug);
  if (!dst) notFound();

  const countryData = dst.countries || null;
  const gallery = imagesToGallery(dst.images ?? []);
  const hero = gallery[0] || resolveImageUrl(firstImageFromImages(dst.images ?? []));

  const [dayItineraries, sights, food, accommodation, experiences, tours] = await Promise.all([
    (async () => {
      const db = getPublicDB();
      const { data, error } = await db
        .from("day_itineraries")
        .select("id, slug, name, summary, destination_id, status, updated_at")
        .eq("destination_id", dst.id)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(3);
      if (error) return [];
      return data ?? [];
    })(),
    fetchSectionPreview(
      dst.id,
      "sights",
      "id, slug, name, summary, images",
      6
    ),
    fetchSectionPreview(
      dst.id,
      "food_drink",
      "id, slug, name, description, images, type, rating"
    ),
    fetchSectionPreview(
      dst.id,
      "accommodation",
      "id, slug, name, summary, images, rating"
    ),
    fetchSectionPreview(
      dst.id,
      "experiences",
      "id, slug, name, summary, images"
    ),
    fetchSectionPreview(dst.id, "tours", "id, slug, name, summary, images"),
  ]);

  const sections = [
    { key: "day-itineraries", label: "Day Itineraries", items: dayItineraries },
    { key: "sights", label: "Sights", items: sights },
    { key: "food-drink", label: "Food & Drink", items: food },
    { key: "accommodation", label: "Accommodation", items: accommodation },
    { key: "experiences", label: "Experiences", items: experiences },
    { key: "tours", label: "Tours", items: tours },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {dst?.id ? (
        <ContentViewTracker type="destination" id={dst.id} />
      ) : null}
      <div className="space-y-3">
        <Breadcrumbs
          items={[
            { label: "Countries", href: countryPath() },
            {
              label: countryData?.name || "Country",
              href: countryPath(countrySlug),
            },
            { label: dst.name, href: destinationPath(countrySlug, destinationSlug) },
          ]}
        />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-medium">{dst.name}</h1>
          </div>
        </div>
      </div>

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

      <PopularRightNow
        heading="Popular right now"
        compact
        limitPerType={3}
        maxItems={6}
        linkHref={null}
        countrySlug={countrySlug}
        destinationSlug={destinationSlug}
      />

      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold">Top sights</h2>
        {sights.length === 0 ? (
          <div className="rounded-xl border bg-muted/50 p-4 text-muted-foreground">
            Top sights coming soon.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sights.map((sight) => {
              const img = resolveImageUrl(firstImageFromImages(sight?.images));
              return (
                <Card key={sight.id} className="overflow-hidden transition hover:shadow-md">
                  <Link
                    href={destinationItemPath(
                      countrySlug,
                      destinationSlug,
                      "sights",
                      sight.slug
                    )}
                    className="block focus:outline-none focus:ring-2 focus:ring-ring/40"
                  >
                    <div className="relative aspect-[4/3] bg-black/5">
                      {img ? (
                        <SafeImage
                          src={img}
                          alt={sight.name}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                        <div className="text-base font-semibold">
                          {sight.name}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      {sight.summary ? (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {sight.summary}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold">Explore {dst.name}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <div
              key={section.key}
              className="rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={
                    section.key === "day-itineraries"
                      ? "/day-itineraries"
                      : destinationSectionPath(
                          countrySlug,
                          destinationSlug,
                          section.key
                        )
                  }
                  className="text-lg font-semibold underline underline-offset-4"
                >
                  {section.label}
                </Link>
                <span className="text-xs text-muted-foreground">View all</span>
              </div>
              {section.items.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={
                          section.key === "day-itineraries"
                            ? `/day-itineraries/${encodeURIComponent(item.slug)}`
                            : destinationItemPath(
                                countrySlug,
                                destinationSlug,
                                section.key,
                                item.slug
                              )
                        }
                        className="underline underline-offset-4"
                      >
                        {item.name || item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Curated picks coming soon.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            Browse {dst.name} by interest
          </h2>
          <span className="text-sm text-muted-foreground">
            Start with a theme.
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {INTERESTS.map((interest) => (
            <Link
              key={interest.label}
              href={`/search?q=${encodeURIComponent(
                `${interest.query} ${dst.name}`
              )}`}
              className="rounded-full border px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
            >
              {interest.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
