import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";

export default function Experiences({ items = [] }) {
  const sorted = Array.isArray(items)
    ? [...items].sort((a, b) =>
        (a.title || a.name || "").localeCompare(b.title || b.name || "")
      )
    : [];

  return (
    <section id="experiences">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-4xl font-medium">Experiences</h2>
        </div>
        <div className="border-b-2 border-border mt-3" />
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
          const href = p?.slug ? `/experiences/${encodeURIComponent(p.slug)}` : null;
          const CardTag = href ? Link : "div";
          const cardProps = href ? { href } : {};
          return (
            <Card key={p.id} asChild className="group overflow-hidden transition-shadow hover:shadow-md">
              <CardTag {...cardProps} className="block focus:outline-none focus:ring-2 focus:ring-ring">
              <div className="relative h-64 w-full bg-muted">
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
              <CardContent className="p-4">
                <div className="font-medium">{p.title || p.name}</div>
                {p.summary ? (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    {p.summary}
                  </p>
                ) : null}
              </CardContent>
              </CardTag>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
