import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { fetchPopularContent } from "@/lib/contentViews";
import {
  countryPath,
  destinationItemPath,
  destinationPath,
} from "@/lib/routes";

export default async function PopularRightNow({
  heading = "Popular right now",
  limitPerType = 4,
  maxItems = 12,
  linkHref = countryPath(),
  linkLabel = "See more",
  compact = false,
}) {
  const popular = await fetchPopularContent(limitPerType);
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
    ...popular.trips.map((p) => ({
      ...p,
      type: "Trip",
      href: p?.id ? `/trips/${p.id}` : null,
    })),
  ].slice(0, maxItems);

  const sectionClassName = compact ? "mt-12 space-y-4" : "bg-muted/40 py-12";
  const containerClassName = compact
    ? "space-y-4"
    : "mx-auto max-w-6xl px-4 space-y-4";

  return (
    <section className={sectionClassName}>
      <div className={containerClassName}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{heading}</h2>
          {linkHref ? (
            <Link href={linkHref} className="text-sm underline text-muted-foreground">
              {linkLabel}
            </Link>
          ) : null}
        </div>
        {mixedPopular.length === 0 ? (
          <div className="rounded-xl border bg-muted/40 p-4 text-muted-foreground">
            Popular picks will appear here as people explore the site.
          </div>
        ) : (
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
                    {item.summary || item.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {item.summary || item.description}
                      </p>
                    ) : null}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
