import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import accommodationData from "@/data/accommodation";
import { resolveImageUrl } from "@/lib/imageUrl";

export default function Accommodation({ items }) {
  const source =
    Array.isArray(items) && items.length > 0 ? items : accommodationData;
  const sorted = [...source].sort((a, b) =>
    (a.title || a.name).localeCompare(b.title || b.name)
  );

  return (
    <section id="accommodation">
      <div className="border-t-2 border-black/10 pt-4">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-4xl font-medium">Accommodation</h2>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sorted.map((item) => (
          <div key={item.slug} className="group">
            <Link
              href={`/accommodation/${item.slug}`}
              className="relative overflow-hidden rounded-xl block"
            >
              <div className="relative h-64 w-full">
                <SafeImage
                  src={
                    resolveImageUrl(
                      (Array.isArray(item.images) && item.images.length > 0
                        ? item.images[0]
                        : item.image || item.thumbnail_image || item.hero_image) ||
                        "/images/destinations/tokyo/tokyo1.jpg"
                    )
                  }
                  alt={`${item.title || item.name}`}
                  fill
                  sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 " />
              <div className="absolute bottom-3 left-3 text-white text-lg font-medium">
                {item.title || item.name}
              </div>
            </Link>
            {item.credit ? (
              <div className="mt-1 text-xs text-gray-500 text-right">
                {item.credit}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
