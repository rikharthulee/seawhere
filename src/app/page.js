import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveImageUrl } from "@/lib/imageUrl";
import {
  fetchFeaturedCountries,
  fetchPopularContent,
} from "@/lib/data/public/country";
import {
  countryPath,
  destinationItemPath,
  destinationPath,
} from "@/lib/routes";

export const revalidate = 300;
export const runtime = "nodejs";

const INTERESTS = [
  { label: "Temples", href: "/search?q=temples" },
  { label: "Waterfalls", href: "/search?q=waterfalls" },
  { label: "Beaches", href: "/search?q=beaches" },
  { label: "Night markets", href: "/search?q=night%20markets" },
  { label: "Adventure", href: "/search?q=adventure" },
  { label: "Wellness", href: "/search?q=wellness" },
  { label: "Cafés", href: "/search?q=caf%C3%A9s" },
];

export default async function HomePage() {
  const featuredCountries = await fetchFeaturedCountries(6);
  const popular = await fetchPopularContent(4);
  const mixedPopular = [
    ...popular.destinations.map((p) => ({
      ...p,
      type: "Destination",
      href:
        p?.countries?.slug && p?.slug
          ? destinationPath(p.countries.slug, p.slug)
          : null,
    })),
    ...popular.sights.map((p) => ({
      ...p,
      type: "Sight",
      href:
        p?.destinations?.countries?.slug && p?.destinations?.slug
          ? destinationItemPath(
              p.destinations.countries.slug,
              p.destinations.slug,
              "sights",
              p.slug
            )
          : null,
    })),
    ...popular.experiences.map((p) => ({
      ...p,
      type: "Experience",
      href:
        p?.destinations?.countries?.slug && p?.destinations?.slug
          ? destinationItemPath(
              p.destinations.countries.slug,
              p.destinations.slug,
              "experiences",
              p.slug
            )
          : null,
    })),
    ...popular.food.map((p) => ({
      ...p,
      type: "Food & Drink",
      href:
        p?.destinations?.countries?.slug && p?.destinations?.slug
          ? destinationItemPath(
              p.destinations.countries.slug,
              p.destinations.slug,
              "food-drink",
              p.slug
            )
          : null,
    })),
    ...popular.accommodation.map((p) => ({
      ...p,
      type: "Stay",
      href:
        p?.destinations?.countries?.slug && p?.destinations?.slug
          ? destinationItemPath(
              p.destinations.countries.slug,
              p.destinations.slug,
              "accommodation",
              p.slug
            )
          : null,
    })),
    ...popular.tours.map((p) => ({
      ...p,
      type: "Tour",
      href:
        p?.destinations?.countries?.slug && p?.destinations?.slug
          ? destinationItemPath(
              p.destinations.countries.slug,
              p.destinations.slug,
              "tours",
              p.slug
            )
          : null,
    })),
  ].slice(0, 12);

  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 opacity-90" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),transparent_45%)]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-white">
          <p className="text-sm uppercase tracking-[0.25em] text-white/70">
            Southeast Asia
          </p>
          <h1 className="mt-3 text-4xl md:text-5xl font-semibold max-w-3xl leading-tight">
            Plan immersive trips by country or by interest
          </h1>
          <p className="mt-4 text-white/80 max-w-2xl text-lg">
            Browse curated destinations, sights, food, stays and experiences across Laos, Thailand, Vietnam, Cambodia and beyond.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={countryPath()}>Browse countries</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white text-black hover:bg-white/90">
              <Link href="/search">Explore by interest</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured countries */}
      <section className="mx-auto max-w-6xl px-4 py-12 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured countries</h2>
          <Link href={countryPath()} className="text-sm underline text-muted-foreground">
            View all
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredCountries.map((c) => (
            <CountryCard key={c.id} country={c} />
          ))}
        </div>
      </section>

      {/* Popular right now */}
      <section className="bg-muted/40 py-12">
        <div className="mx-auto max-w-6xl px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Popular right now</h2>
            <Link href={countryPath()} className="text-sm underline text-muted-foreground">
              See more
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mixedPopular.map((item, idx) => (
              <Card key={`${item.type}-${item.id}-${idx}`} className="overflow-hidden transition hover:shadow-md">
                <Link href={item.href || "#"} className="block focus:outline-none focus:ring-2 focus:ring-ring/40">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      <span>{item.type}</span>
                      {item.country_id ? <span>SEA</span> : null}
                    </div>
                    <div className="font-semibold text-lg leading-tight">
                      {item.title || item.name}
                    </div>
                    {item.summary ? (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {item.summary}
                      </p>
                    ) : null}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by interest */}
      <section className="mx-auto max-w-6xl px-4 py-12 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Browse by interest</h2>
          <span className="text-sm text-muted-foreground">
            Pick a theme to jump in.
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {INTERESTS.map((interest) => (
            <Link
              key={interest.label}
              href={interest.href}
              className="rounded-full border px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition"
            >
              {interest.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured trips */}
      <section className="mx-auto max-w-6xl px-4 pb-14 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Featured trips</h2>
          <Link href="/blog" className="text-sm underline text-muted-foreground">
            View blog
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-dashed">
              <CardContent className="p-4 space-y-2">
                <div className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                  Coming soon
                </div>
                <div className="font-semibold text-lg">Trip {i}</div>
                <p className="text-sm text-muted-foreground">
                  Placeholder for curated routes across multiple countries.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

function CountryCard({ country }) {
  const hero = resolveImageUrl(country.hero_image);
  return (
    <Card className="overflow-hidden transition hover:shadow-md">
      <Link
        href={countryPath(country.slug)}
        className="block focus:outline-none focus:ring-2 focus:ring-ring/40"
      >
        <div className="relative aspect-[4/3] bg-black/5">
          {hero ? (
            <SafeImage
              src={hero}
              alt={country.name}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white space-y-1">
            <div className="text-lg font-semibold">{country.name}</div>
            <p className="text-sm text-white/80 line-clamp-2">
              {country.summary || "Curated destinations, food, stays and experiences."}
            </p>
          </div>
        </div>
        <CardContent className="p-4 flex items-center justify-between text-sm text-muted-foreground">
          <span />
          <span className="font-medium text-foreground underline">Explore</span>
        </CardContent>
      </Link>
    </Card>
  );
}
