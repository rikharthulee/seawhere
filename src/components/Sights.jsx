import Image from "next/image";
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
          return (
            <article key={p.id} className="group relative overflow-hidden rounded-xl border">
              <div className="relative h-64 w-full bg-black/5">
                {img ? (
                  <Image
                    src={img}
                    alt={p.title}
                    fill
                    sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <div className="p-3">
                <div className="font-medium">{p.title}</div>
                {p.summary ? (
                  <p className="text-sm text-black/70 mt-1 line-clamp-3">{p.summary}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

