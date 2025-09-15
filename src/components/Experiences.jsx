import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/imageUrl";

export default function Experiences({ items = [] }) {
  const sorted = Array.isArray(items)
    ? [...items].sort((a, b) =>
        (a.title || a.name || "").localeCompare(b.title || b.name || "")
      )
    : [];

  return (
    <section id="experiences">
      <div className="border-t-2 border-black/10 pt-2">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-4xl font-medium">Experiences</h2>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sorted.map((p) => {
          let imgPath = p.image || null;
          if (!imgPath && p.images) {
            if (Array.isArray(p.images) && p.images.length > 0) {
              const first = p.images[0];
              imgPath =
                (first && (first.url || first.src)) ||
                (typeof first === "string" ? first : null);
            } else if (typeof p.images === "string") {
              imgPath = p.images;
            }
          }
          const img = resolveImageUrl(imgPath);
          const destSlug = p?.destinations?.slug || p?.destination?.slug || null;
          const canLink = !!(p.slug && destSlug);
          const CardTag = canLink ? Link : "div";
          const cardProps = canLink
            ? {
                href: `/experiences/${encodeURIComponent(
                  destSlug
                )}/${encodeURIComponent(p.slug)}`,
              }
            : {};
          return (
            <CardTag
              key={p.id}
              {...cardProps}
              className="group block relative overflow-hidden rounded-xl border focus:outline-none focus:ring-2 focus:ring-black/40"
            >
              <div className="relative h-64 w-full bg-black/5">
                {img ? (
                  <SafeImage
                    src={img}
                    alt={p.title || p.name}
                    fill
                    sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <div className="p-3">
                <div className="font-medium">{p.title || p.name}</div>
                {p.summary ? (
                  <p className="text-sm text-black/70 mt-1 line-clamp-3">
                    {p.summary}
                  </p>
                ) : null}
              </div>
            </CardTag>
          );
        })}
      </div>
    </section>
  );
}
