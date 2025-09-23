import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

function normalize(rows = []) {
  return rows
    .filter((row) => row && row.id)
    .map((row) => {
      const desc =
        (typeof row.description === "object" && row.description?.text) ||
        (typeof row.description === "string" && row.description) ||
        row.summary ||
        null;
      return {
        id: row.id,
        slug: row.slug || row.id,
        title: row.name || row.title || "Untitled excursion",
        summary: desc,
        status: row.status || null,
        updatedAt: row.updated_at || row.updatedAt || row.modified_at || null,
        hasTransport: Array.isArray(row.transport) && row.transport.length > 0,
        hasMap: Boolean(row.maps_url),
      };
    });
}

export default function ExcursionsGallery({ rows = [] }) {
  const excursions = normalize(rows);

  if (!excursions.length) {
    return (
      <section className="space-y-8">
        <header className="max-w-3xl space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Curated Excursions
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Explore saved itineraries assembled by our travel specialists—great
            starting points for your own plans.
          </p>
        </header>
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          No excursions published yet.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="max-w-3xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Curated Excursions
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          Explore saved itineraries assembled by our travel specialists—great
          starting points for your own plans.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {excursions.map((x) => {
          const meta = [];
          if (x.hasTransport) meta.push("Includes transport");
          if (x.hasMap) meta.push("Map link");
          const href = `/excursions/${x.slug}`;

          return (
            <Card key={x.id} className="group h-full overflow-hidden border-border/70">
              <CardHeader className="p-0">
                <Link href={href} className="block">
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                    <img
                      src={placeholderDataUrl(x.title)}
                      alt={x.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </Link>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <CardTitle className="text-lg font-semibold leading-tight">
                  <Link href={href} className="hover:underline">
                    {x.title}
                  </Link>
                </CardTitle>
                {x.summary ? (
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {x.summary}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-1">
                    {meta.map((label) => (
                      <Badge
                        key={`${x.id}-${label}`}
                        variant="secondary"
                        className="text-[11px] font-normal"
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>
                  {x.updatedAt ? (
                    <time dateTime={x.updatedAt}>
                      {new Date(x.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
