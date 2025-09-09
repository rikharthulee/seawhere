import Link from "next/link";
import Image from "next/image";
import destinationsData from "@/data/locations";
import { resolveImageUrl } from "@/lib/imageUrl";

export default function Locations({ items, basePath = "/destinations" }) {
  const source =
    Array.isArray(items) && items.length > 0 ? items : destinationsData;
  // Sort alphabetically
  const sortedDestinations = [...source].sort((a, b) =>
    (a.title || a.name).localeCompare(b.title || b.name)
  );

  return (
    <section id="locations">
      <div className="border-t-2 border-black/10 pt-4">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-4xl font-medium">Destinations</h2>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sortedDestinations.map((d) => (
          <div key={d.slug} className="group">
            <Link
              href={`${basePath}/${d.slug}`}
              className="relative overflow-hidden rounded-xl block"
            >
              <div className="relative h-64 w-full">
                <Image
                  src={
                    resolveImageUrl(
                      (Array.isArray(d.images) && d.images.length > 0
                        ? d.images[0]
                        : d.image || d.thumbnail_image || d.hero_image) ||
                        "/images/destinations/tokyo/tokyo1.jpg"
                    )
                  }
                  alt={`${d.title || d.name}`}
                  fill
                  sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                  priority={false}
                />
              </div>
              <div className="absolute inset-0 " />
              <div className="absolute bottom-3 left-3 text-white text-lg font-medium">
                {d.title || d.name}
              </div>
            </Link>
            {d.credit ? (
              <div className="mt-1 text-xs text-gray-500 text-right">
                {d.credit}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
