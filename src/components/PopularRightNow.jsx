import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import SafeImage from "@/components/SafeImage";
import { fetchPopularContent } from "@/lib/contentViews";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";
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
      href: p?.slug ? `/trips/${p.slug}` : null,
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
              <Card
                key={`${item.type}-${item.id}-${idx}`}
                className="overflow-hidden transition hover:shadow-md"
              >
                <Link
                  href={item.href || "#"}
                  className="block focus:outline-none focus:ring-2 focus:ring-ring/40"
                >
                  {(() => {
                    const img = resolveImageUrl(
                      firstImageFromImages(item?.images)
                    );
                    return (
                      <div className="relative aspect-[4/3] bg-black/5">
                        {img ? (
                          <SafeImage
                            src={img}
                            alt={item.title || item.name || "Popular pick"}
                            fill
                            className="object-cover"
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                          <div className="text-base font-semibold">
                            {item.title || item.name}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <CardContent className="p-4 space-y-2">
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
