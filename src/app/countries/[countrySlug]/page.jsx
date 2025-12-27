import Link from "next/link";
import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import EmblaCarousel from "@/components/EmblaCarousel";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Breadcrumbs from "@/components/Breadcrumbs";
import PopularRightNow from "@/components/PopularRightNow";
import {
  firstImageFromImages,
  imagesToGallery,
  resolveImageUrl,
} from "@/lib/imageUrl";
import {
  listDestinationsByCountrySlug,
  getCountryBySlugPublic,
} from "@/lib/data/public/geo";
import { fetchCountryHighlights } from "@/lib/data/public/country";
import { getPublicDB } from "@/lib/supabase/public";
import {
  countryPath,
  destinationItemPath,
  destinationPath,
} from "@/lib/routes";

export const revalidate = 300;
export const runtime = "nodejs";

function ContentGrid({ items = [], hrefFor, titleKey = "name", summaryKey = "summary" }) {
  if (!items.length) {
    return (
      <div className="rounded border bg-muted/50 p-4 text-muted-foreground">
        Coming soon.
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const href = hrefFor(item);
        const img = resolveImageUrl(firstImageFromImages(item?.images));
        const CardTag = href ? Link : "div";
        const cardProps = href ? { href } : {};
        return (
          <Card key={item.id} className="overflow-hidden transition hover:shadow-md">
            <CardTag
              {...cardProps}
              className="block focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <div className="relative aspect-[4/3] bg-black/5">
                {img ? (
                  <SafeImage
                    src={img}
                    alt={item[titleKey]}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                ) : null}
              </div>
              <CardContent className="p-4 space-y-2">
                <div className="font-semibold">{item[titleKey]}</div>
                {item[summaryKey] ? (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item[summaryKey]}
                  </p>
                ) : null}
              </CardContent>
            </CardTag>
          </Card>
        );
      })}
    </div>
  );
}

export async function generateMetadata(props) {
  const { countrySlug } = (await props.params) || {};
  const country = await getCountryBySlugPublic(countrySlug);
  if (!country) return {};
  return {
    title: `${country.name} | Seawhere`,
    description:
      country.summary || `Plan your trip across ${country.name}.`,
  };
}

export default async function CountryLandingPage(props) {
  const { countrySlug } = (await props.params) || {};
  const { country, destinations } = await listDestinationsByCountrySlug(
    countrySlug
  );
  if (!country) notFound();

  const highlights = await fetchCountryHighlights(country.id);
  const db = getPublicDB();
  const { data: trips } = await db
    .from("trips")
    .select("id, slug, title, summary, visibility, destination_id, destinations ( name )")
    .eq("country_id", country.id)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(6);

  const hero = resolveImageUrl(
    country.hero_image || firstImageFromImages(highlights.destinations?.[0]?.images)
  );
  const heroGallery = imagesToGallery([country.hero_image].filter(Boolean));
  const heroSlides = heroGallery.length > 0 ? heroGallery : hero ? [hero] : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: "Countries", href: countryPath() },
            { label: country.name, href: countryPath(country.slug) },
          ]}
        />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
        {heroSlides.length ? (
          <div className="absolute inset-0 opacity-60">
            <EmblaCarousel
              images={heroSlides}
              options={{ loop: true, align: "start" }}
              className="h-full"
              slideClass="h-[46vh] min-h-[360px]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/40" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700" />
        )}
        <div className="relative z-10 px-6 py-10 md:px-10">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.2em] text-white/70">
                Explore
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold">{country.name}</h1>
              <p className="max-w-2xl text-white/85">
                {country.summary ||
                  `Discover the best of ${country.name}: curated destinations, sights, food and stays.`}
              </p>
            </div>
            <Link
              href={countryPath()}
              className="inline-flex items-center text-sm underline decoration-white/60 decoration-2 underline-offset-4"
            >
              All countries
            </Link>
          </div>
        </div>
      </section>

      <PopularRightNow
        heading="Popular right now"
        compact
        limitPerType={3}
        maxItems={6}
        linkHref={null}
        countrySlug={country?.slug || countrySlug}
      />

      {/* Featured destinations */}
      <section className="mt-10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured destinations</h2>
          <span className="text-sm text-muted-foreground">
            {destinations.length} destinations
          </span>
        </div>
        <ContentGrid
          items={destinations}
          hrefFor={(d) =>
            d?.slug && country?.slug
              ? destinationPath(country.slug, d.slug)
              : null
          }
          summaryKey="summary"
        />
      </section>

      {/* Popular tabs */}
      <section className="mt-12 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Trips in {country.name}</h2>
        </div>
        {Array.isArray(trips) && trips.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <Card key={trip.id} className="overflow-hidden transition hover:shadow-md">
                <Link
                  href={`/trips/${trip.slug}`}
                  className="block focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Trip
                    </div>
                    <div className="text-lg font-semibold">
                      {trip.title || "Untitled trip"}
                    </div>
                    {trip.destinations?.name ? (
                      <div className="text-sm text-muted-foreground">
                        {trip.destinations.name}
                      </div>
                    ) : null}
                    {trip.summary ? (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {trip.summary}
                      </p>
                    ) : null}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded border bg-muted/50 p-4 text-muted-foreground">
            Trips coming soon.
          </div>
        )}
      </section>

      {/* Popular tabs */}
      <section className="mt-12 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Popular in {country.name}</h2>
        </div>
        <Tabs defaultValue="sights" className="w-full">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="sights">Sights</TabsTrigger>
            <TabsTrigger value="experiences">Experiences</TabsTrigger>
            <TabsTrigger value="food">Food &amp; Drink</TabsTrigger>
            <TabsTrigger value="accommodation">Accommodation</TabsTrigger>
            <TabsTrigger value="tours">Tours</TabsTrigger>
          </TabsList>
          <TabsContent value="sights" className="mt-4">
            <ContentGrid
              items={highlights.sights}
              hrefFor={(it) =>
                it?.destinations?.slug && it?.slug
                  ? destinationItemPath(
                      country.slug,
                      it.destinations.slug,
                      "sights",
                      it.slug
                    )
                  : null
              }
              summaryKey="summary"
              titleKey="name"
            />
          </TabsContent>
          <TabsContent value="experiences" className="mt-4">
            <ContentGrid
              items={highlights.experiences}
              hrefFor={(it) =>
                it?.destinations?.slug && it?.slug
                  ? destinationItemPath(
                      country.slug,
                      it.destinations.slug,
                      "experiences",
                      it.slug
                    )
                  : null
              }
              summaryKey="summary"
              titleKey="name"
            />
          </TabsContent>
          <TabsContent value="food" className="mt-4">
            <ContentGrid
              items={highlights.food}
              hrefFor={(it) =>
                it?.destinations?.slug && it?.slug
                  ? destinationItemPath(
                      country.slug,
                      it.destinations.slug,
                      "food-drink",
                      it.slug
                    )
                  : null
              }
              summaryKey="description"
              titleKey="name"
            />
          </TabsContent>
          <TabsContent value="accommodation" className="mt-4">
            <ContentGrid
              items={highlights.accommodation}
              hrefFor={(it) =>
                it?.destinations?.slug && it?.slug
                  ? destinationItemPath(
                      country.slug,
                      it.destinations.slug,
                      "accommodation",
                      it.slug
                    )
                  : null
              }
              summaryKey="summary"
              titleKey="name"
            />
          </TabsContent>
          <TabsContent value="tours" className="mt-4">
            <ContentGrid
              items={highlights.tours}
              hrefFor={(it) =>
                it?.destinations?.slug && it?.slug
                  ? destinationItemPath(
                      country.slug,
                      it.destinations.slug,
                      "tours",
                      it.slug
                    )
                  : null
              }
              summaryKey="summary"
              titleKey="name"
            />
          </TabsContent>
        </Tabs>
      </section>

      {/* Guides / Trips */}
      <section className="mt-12 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Guides &amp; trips</h2>
          <Link href="/blog" className="text-sm underline text-muted-foreground">
            View blog
          </Link>
        </div>
        <Card>
          <CardContent className="p-4 text-muted-foreground">
            Curated guides and trips for {country.name} coming soon.
          </CardContent>
        </Card>
      </section>

      {/* Map placeholder */}
      <section className="mt-12 space-y-3">
        <h2 className="text-2xl font-semibold">Map</h2>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="h-64 grid place-items-center bg-muted text-muted-foreground">
              Map view coming soon.{" "}
              <Link href={countryPath(country.slug)} className="underline ml-1">
                Open map
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
