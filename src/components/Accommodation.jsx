import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { Card, CardContent } from "@/components/ui/card";
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
      <div className="border-t-2 border-black/10 pt-2">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-4xl font-medium">Accommodation</h2>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sorted.map((item) => (
          <Card key={item.slug} asChild className="group overflow-hidden transition-shadow hover:shadow-md">
            <Link href={`/accommodation/${item.slug}`} className="relative block focus:outline-none focus:ring-2 focus:ring-ring">
              <div className="relative h-64 w-full bg-muted">
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
              <div className="absolute bottom-3 left-3 text-white text-lg font-medium drop-shadow">
                {item.title || item.name}
              </div>
              {item.credit ? (
                <CardContent className="pt-2">
                  <div className="text-xs text-muted-foreground text-right">{item.credit}</div>
                </CardContent>
              ) : null}
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
