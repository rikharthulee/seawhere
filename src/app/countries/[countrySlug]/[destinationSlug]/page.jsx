import { notFound } from "next/navigation";
import Link from "next/link";
import EmblaCarousel from "@/components/EmblaCarousel";
import SafeImage from "@/components/SafeImage";
import RichText from "@/components/RichText";
import Breadcrumbs from "@/components/Breadcrumbs";
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

  const [sights, food, accommodation, experiences, tours] = await Promise.all([
    fetchSectionPreview(
      dst.id,
      "sights",
      "id, slug, name, summary, images"
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
    { key: "sights", label: "Sights", items: sights },
    { key: "food-drink", label: "Food & Drink", items: food },
    { key: "accommodation", label: "Accommodation", items: accommodation },
    { key: "experiences", label: "Experiences", items: experiences },
    { key: "tours", label: "Tours", items: tours },
    { key: "transport", label: "Transport", items: [] },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
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
                  href={destinationSectionPath(
                    countrySlug,
                    destinationSlug,
                    section.key
                  )}
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
                        href={destinationItemPath(
                          countrySlug,
                          destinationSlug,
                          section.key,
                          item.slug
                        )}
                        className="underline underline-offset-4"
                      >
                        {item.name}
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
    </main>
  );
}
