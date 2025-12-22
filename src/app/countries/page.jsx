import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { Card, CardContent } from "@/components/ui/card";
import { listCountriesPublic, listDestinationsByCountryId } from "@/lib/data/public/geo";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";

export const revalidate = 300;
export const runtime = "nodejs";

export default async function CountriesPage() {
  const countries = await listCountriesPublic();
  const destsByCountry = new Map();
  await Promise.all(
    countries.map(async (c) => {
      const dests = await listDestinationsByCountryId(c.id);
      destsByCountry.set(c.id, dests.slice(0, 3));
    })
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="pt-2">
        <h1 className="text-3xl md:text-4xl font-semibold">Countries</h1>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          Browse our Southeast Asia coverage by country. Jump into destinations, sights, food and stays with curated picks.
        </p>
      </div>

      <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map((country) => (
          <CountryCard
            key={country.id}
            country={country}
            destinations={destsByCountry.get(country.id) || []}
          />
        ))}
      </section>
    </main>
  );
}

function CountryCard({ country, destinations }) {
  const hero =
    resolveImageUrl(country.hero_image) ||
    resolveImageUrl(firstImageFromImages(destinations?.[0]?.images));
  return (
    <Card className="overflow-hidden transition hover:shadow-md">
      <Link
        href={`/countries/${country.slug}`}
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="text-lg font-semibold">{country.name}</div>
            <p className="text-sm text-white/80 line-clamp-2">
              {country.summary || "Discover destinations, food, stays and experiences."}
            </p>
          </div>
        </div>
      </Link>
      <CardContent className="p-4 space-y-3">
        {destinations?.length ? (
          <div className="space-y-1">
            <div className="text-sm font-semibold text-muted-foreground">
              Top destinations
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {destinations.map((d) => (
                <Link
                  key={d.id}
                  href={
                    d.slug && country.slug
                      ? `/destinations/${country.slug}/${d.slug}`
                      : "#"
                  }
                  className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground hover:text-foreground"
                >
                  {d.name}
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Destinations coming soon.
          </div>
        )}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span />
          <span className="font-medium text-foreground underline">Explore</span>
        </div>
      </CardContent>
    </Card>
  );
}
