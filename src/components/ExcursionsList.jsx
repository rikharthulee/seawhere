import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import excursionsData from "@/data/excursions";
import { resolveImageUrl } from "@/lib/imageUrl";

export default function ExcursionsList({ items = [], basePath = "/excursions" }) {
  const source =
    Array.isArray(items) && items.length > 0 ? items : excursionsData;
  const sortedExcursions = [...source].sort((a, b) =>
    (a.title || a.name).localeCompare(b.title || b.name)
  );

  return (
    <section id="excursions">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-4xl font-medium">Excursions</h2>
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sortedExcursions.map((excursion) => (
          <div key={excursion.slug || excursion.id} className="group">
            <Link
              href={`${basePath}/${excursion.slug}`}
              className="relative overflow-hidden rounded-xl block"
            >
              <div className="relative h-64 w-full">
                <SafeImage
                  src={
                    resolveImageUrl(
                      excursion.image ||
                        (Array.isArray(excursion.images) && excursion.images.length > 0
                          ? excursion.images[0]
                          : null)
                    ) || "/images/destinations/tokyo/tokyo1.jpg"
                  }
                  alt={`${excursion.title || excursion.name}`}
                  fill
                  sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 " />
              <div className="absolute bottom-3 left-3 text-white text-lg font-medium">
                {excursion.title || excursion.name}
              </div>
            </Link>
            {excursion.credit ? (
              <div className="mt-1 text-xs text-muted-foreground text-right">
                {excursion.credit}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
