import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";
import { Tile } from "@/components/ui/tile";

export default function Sights({ items = [] }) {
  const sorted = Array.isArray(items)
    ? [...items].sort((a, b) =>
        (a.title || a.name || "").localeCompare(b.title || b.name || "")
      )
    : [];

  return (
    <section id="sights">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-4xl font-medium">Sights</h2>
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sorted.map((p) => {
          const img = resolveImageUrl(firstImageFromImages(p?.images));
          const href = p?.slug ? `/sights/${encodeURIComponent(p.slug)}` : null;
          return (
            <Tile.Link key={p.id} href={href || "#"}>
              <Tile.Image>
                {img ? (
                  <SafeImage
                    src={img}
                    alt={p.title || p.name}
                    fill
                    sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : null}
                {/* Type badge */}
                {p.type ? (
                  <span className="absolute left-2 top-2 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
                    {String(p.type).slice(0, 1).toUpperCase() +
                      String(p.type).slice(1)}
                  </span>
                ) : null}
                {p.deeplink ? (
                  <span className="absolute right-2 top-2 rounded bg-primary text-primary-foreground text-xs px-2 py-0.5">
                    Book
                  </span>
                ) : null}
              </Tile.Image>
              <Tile.Content>
                <div className="font-medium">{p.title || p.name}</div>
                {p.summary ? (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    {p.summary}
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
