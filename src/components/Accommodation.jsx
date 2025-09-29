import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { Card, CardContent } from "@/components/ui/card";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";

export default function Accommodation({ items }) {
  // Require items to be passed in - no fallback to static data
  if (!Array.isArray(items) || items.length === 0) {
    console.error("Accommodation component: No items provided");
    return (
      <section id="accommodation">
        <div className="border-t-2 border-black/10 pt-2">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl md:text-4xl font-medium">Accommodation</h2>
          </div>
          <div className="border-b-2 border-black/10 mt-3" />
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
      <div className="border-t-2 border-black/10 pt-2">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-4xl font-medium">Accommodation</h2>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sorted.map((item) => {
          const img = resolveImageUrl(firstImageFromImages(item?.images));
          const displayName = item.title || item.name;

          // Log warnings for missing data
          if (!img) {
            console.warn(
              `Missing image for accommodation: ${displayName} (slug: ${item.slug})`
            );
          }
          if (!displayName) {
            console.error(
              `Missing title/name for accommodation with slug: ${item.slug}`
            );
          }
          if (!item.slug) {
            console.error(`Missing slug for accommodation:`, item);
          }

          return (
            <Card
              key={item.slug || `accommodation-${displayName}`}
              asChild
              className="group overflow-hidden transition-shadow hover:shadow-md"
            >
              <Link
                href={`/accommodation/${item.slug}`}
                className="relative block focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <div className="relative h-64 w-full bg-muted">
                  {img ? (
                    <SafeImage
                      src={img}
                      alt={displayName || "Accommodation"}
                      fill
                      sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <span className="text-sm">No image available</span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-3 left-3 text-white text-lg font-medium drop-shadow-lg">
                  {displayName || "Unnamed Accommodation"}
                </div>
                {item.credit ? (
                  <CardContent className="pt-2">
                    <div className="text-xs text-muted-foreground text-right">
                      {item.credit}
                    </div>
                  </CardContent>
                ) : null}
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
