import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/imageUrl";
import { Tile } from "@/components/ui/tile";

function initialsFrom(title = "?") {
  const parts = String(title).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "?";
}

function placeholderDataUrl(title = "Untitled") {
  const palette = [
    "#e2e8f0",
    "#fde68a",
    "#a7f3d0",
    "#bfdbfe",
    "#fbcfe8",
    "#ddd6fe",
    "#fecaca",
  ];
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (h << 5) - h + title.charCodeAt(i);
    h |= 0;
  }
  const bg = palette[Math.abs(h) % palette.length];
  const text = "#111827";
  const initials = initialsFrom(title);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <rect width="1600" height="900" fill="${bg}"/>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
      font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
      font-size="360" fill="${text}" opacity="0.85">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function ExcursionsGallery({ rows = [], basePath = "/excursions" }) {
  const sorted = Array.isArray(rows)
    ? [...rows].sort((a, b) =>
        (a.name || a.title || "").localeCompare(b.name || b.title || "")
      )
    : [];

  return (
    <section id="excursions">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl md:text-4xl font-medium">Excursions</h2>
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>

      {sorted.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border/70 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          No excursions published yet.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {sorted.map((excursion) => {
            const slug = excursion.slug;
            const imageSrc =
              resolveImageUrl(excursion.cover_image) ||
              placeholderDataUrl(excursion.name || excursion.title);
            return (
              <Tile.Link
                key={excursion.id}
                href={slug ? `${basePath}/${encodeURIComponent(slug)}` : `#`}
              >
                <Tile.Image>
                  <SafeImage
                    src={imageSrc}
                    alt={excursion.title || excursion.name}
                    fill
                    sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </Tile.Image>
                <Tile.Content>
                  <div className="font-medium">{excursion.title || excursion.name}</div>
                  {excursion.summary ? (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                      {excursion.summary}
                    </p>
                  ) : null}
                </Tile.Content>
              </Tile.Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
