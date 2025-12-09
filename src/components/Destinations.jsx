import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";

export default function Destinations({
  items = [],
  basePath = "/destination",
}) {
  // Normalize input to an array; keep quiet logs in production
  const source = Array.isArray(items) ? items : [];

  // Sort alphabetically (locale-aware, case-insensitive)
  const sortedDestinations = [...source].sort((a, b) =>
    (a.title || a.name || "").localeCompare(
      b.title || b.name || "",
      undefined,
      {
        sensitivity: "base",
        numeric: true,
      }
    )
  );

  return (
    <section id="destinations">
      <div className="pt-2">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-4xl font-medium">Destinations</h2>
        </div>
      </div>
      {source.length === 0 ? (
        <div className="mt-8 text-center text-muted-foreground">
          No destinations available
        </div>
      ) : null}
      {source.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {sortedDestinations.map((d, idx) => {
            const imageUrl = resolveImageUrl(firstImageFromImages(d.images));
            const displayName = d.title || d.name || "Unnamed Destination";
            const slug = d.slug;
            const key = slug || `destination-${idx}`;

            // Keep warnings minimal; avoid console.error in prod lists
            if (!imageUrl) {
              console.warn(
                `Missing image for destination: ${displayName}${
                  slug ? ` (slug: ${slug})` : ""
                }`
              );
            }

            const CardInner = (
              <>
                <div className="relative h-64 w-full bg-gray-200">
                  {imageUrl ? (
                    <SafeImage
                      src={imageUrl}
                      alt={displayName}
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
                  {displayName}
                </div>
              </>
            );

            return (
              <div key={key} className="group">
                {slug ? (
                  <Link
                    href={`${basePath}/${slug}`}
                    className="relative overflow-hidden rounded-xl block"
                  >
                    {CardInner}
                  </Link>
                ) : (
                  <div className="relative overflow-hidden rounded-xl block">
                    {CardInner}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
