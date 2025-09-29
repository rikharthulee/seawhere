import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";

export default function Destinations({ items, basePath = "/destinations" }) {
  // Require items to be passed in - no fallback to static data
  if (!Array.isArray(items) || items.length === 0) {
    console.error("Destinations component: No items provided");
    return (
      <section id="destinations">
        <div className="border-t-2 border-border pt-2">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl md:text-4xl font-medium">Destinations</h2>
          </div>
          <div className="border-b-2 border-border mt-3" />
        </div>
        <div className="mt-8 text-center text-muted-foreground">
          No destinations available
        </div>
      </section>
    );
  }

  const source = items;

  // Sort alphabetically
  const sortedDestinations = [...source].sort((a, b) =>
    (a.title || a.name || "").localeCompare(b.title || b.name || "")
  );

  return (
    <section id="destinations">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-4xl font-medium">Destinations</h2>
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sortedDestinations.map((d) => {
          const imageUrl = resolveImageUrl(firstImageFromImages(d.images));
          const displayName = d.title || d.name;

          // Log warnings for missing data
          if (!imageUrl) {
            console.warn(
              `Missing image for destination: ${displayName} (slug: ${d.slug})`
            );
          }
          if (!displayName) {
            console.error(
              `Missing title/name for destination with slug: ${d.slug}`
            );
          }
          if (!d.slug) {
            console.error(`Missing slug for destination:`, d);
          }

          return (
            <div key={d.slug || `destination-${displayName}`} className="group">
              <Link
                href={`${basePath}/${d.slug}`}
                className="relative overflow-hidden rounded-xl block"
              >
                <div className="relative h-64 w-full bg-gray-200">
                  {imageUrl ? (
                    <SafeImage
                      src={imageUrl}
                      alt={displayName || "Destination"}
                      fill
                      sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                      priority={false}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <span className="text-sm">No image available</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0" />
                <div className="absolute bottom-3 left-3 text-white text-lg font-medium drop-shadow-lg">
                  {displayName || "Unnamed Destination"}
                </div>
              </Link>
              {d.credit ? (
                <div className="mt-1 text-xs text-muted-foreground text-right">
                  {d.credit}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
