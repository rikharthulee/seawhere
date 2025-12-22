import SafeImage from "@/components/SafeImage";
import { Tile } from "@/components/ui/tile";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";
import { destinationItemPath } from "@/lib/routes";

export default function Accommodation({ items, countrySlug, destinationSlug }) {
  // Require items to be passed in - no fallback to static data
  if (!Array.isArray(items) || items.length === 0) {
    console.error("Accommodation component: No items provided");
    return (
      <section id="accommodation">
        <div className="pt-2">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl md:text-4xl font-medium">Accommodation</h2>
          </div>
        </div>
        <div className="mt-8 text-center text-muted-foreground">
          No accommodation available
        </div>
      </section>
    );
  }

  const sorted = [...items].sort((a, b) =>
    (a.title || a.name || "").localeCompare(b.title || b.name || "")
  );

  return (
    <section id="accommodation">
      <div className="pt-2">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-4xl font-medium">Accommodation</h2>
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sorted.map((item) => {
          const img = resolveImageUrl(firstImageFromImages(item?.images));
          const displayName = item.title || item.name || "Accommodation";
          const href =
            item.slug && countrySlug && destinationSlug
              ? destinationItemPath(
                  countrySlug,
                  destinationSlug,
                  "accommodation",
                  item.slug
                )
              : item.slug
                ? destinationItemPath(
                    item?.countries?.slug,
                    item?.destinations?.slug,
                    "accommodation",
                    item.slug
                  )
                : "#";

          if (!item.slug) {
            console.error("Missing slug for accommodation:", item);
          }

          return (
            <Tile.Link
              key={item.slug || `accommodation-${displayName}`}
              href={href}
              className="group"
            >
              <Tile.Image className="bg-muted">
                {img ? (
                  <SafeImage
                    src={img}
                    alt={displayName}
                    fill
                    sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : null}
              </Tile.Image>
              <Tile.Content>
                <div className="font-medium">{displayName}</div>
                {item.summary ? (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    {item.summary}
                  </p>
                ) : null}
              </Tile.Content>
            </Tile.Link>
          );
        })}
      </div>
    </section>
  );
}
