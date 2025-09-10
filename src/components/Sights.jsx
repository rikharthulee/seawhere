import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/imageUrl";

export default function Sights({ items = [] }) {
  const sorted = Array.isArray(items)
    ? [...items].sort((a, b) => (a.title || "").localeCompare(b.title || ""))
    : [];

  return (
    <section id="sights">
      <div className="border-t-2 border-black/10 pt-4">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-4xl font-medium">Sights</h2>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {sorted.map((p) => {
          const img = resolveImageUrl(p.image);
          const destSlug = p?.destinations?.slug || p?.destination?.slug || null;
          const href = p.slug && destSlug ? `/sights/${encodeURIComponent(destSlug)}/${encodeURIComponent(p.slug)}` : `/sights/poi/${encodeURIComponent(p.id)}`;
          return (
            <Link key={p.id} href={href} className="group block relative overflow-hidden rounded-xl border focus:outline-none focus:ring-2 focus:ring-black/40">
              <div className="relative h-64 w-full bg-black/5">
                {img ? (
                  <SafeImage
                    src={img}
                    alt={p.title}
                    fill
                    sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : null}
                {/* Type badge */}
                {p.type ? (
                  <span className="absolute left-2 top-2 rounded-full bg-black/70 text-white text-xs px-2 py-0.5">
                    {String(p.type).slice(0,1).toUpperCase() + String(p.type).slice(1)}
                  </span>
                ) : null}
              </div>
              <div className="p-3">
                <div className="font-medium">{p.title}</div>
                {p.summary ? (
                  <p className="text-sm text-black/70 mt-1 line-clamp-3">{p.summary}</p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
