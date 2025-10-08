import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import SafeImage from "@/components/SafeImage";
import { resolveImageUrl } from "@/lib/imageUrl";
import { getCuratedExcursionBySlugPublic } from "@/lib/data/public/excursions";

export const revalidate = 300; // ISR every 5 minutes

function firstImage(srcLike) {
  if (!srcLike) return null;
  if (typeof srcLike === "string") return srcLike;
  if (Array.isArray(srcLike) && srcLike.length) {
    const f = srcLike[0];
    if (typeof f === "string") return f;
    if (f?.src) return f.src;
  }
  if (srcLike?.src) return srcLike.src;
  return null;
}

function normalizeItem(it) {
  const e = it?.entity || null;
  return {
    ...it,
    displayName: e?.name || it?.name || "(untitled)",
    displaySummary: e?.summary || it?.summary || "",
    opening_times_url: e?.opening_times_url || it?.opening_times_url || null,
    displayImage: resolveImageUrl(
      firstImage(e?.images) || firstImage(it?.images)
    ),
  };
}

export default async function Page({ params, searchParams }) {
  const { slug } = await params;
  const { debug } = (await searchParams) || {};
  const { excursion, items, transport } = await getCuratedExcursionBySlugPublic(slug);
  if (!excursion && !debug) return notFound();

  const flow = [];
  const len = Math.max(items.length, transport.length);
  for (let i = 0; i < len; i++) {
    if (items[i]) flow.push({ kind: "item", it: normalizeItem(items[i]) });
    if (transport[i]) flow.push({ kind: "leg", leg: transport[i] });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      {(!excursion && debug) ? (
        <pre className="rounded-md border bg-muted p-3 text-xs overflow-x-auto">{JSON.stringify({ slug, debug, excursion, items, transport }, null, 2)}</pre>
      ) : null}
      <header className="space-y-3">
        {excursion ? (
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {excursion.name}
          </h1>
        ) : (
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Excursion</h1>
        )}
        {excursion?.summary && (
          <p className="text-base text-muted-foreground sm:text-lg">
            {excursion.summary}
          </p>
        )}
        {Array.isArray(excursion?.tags) && excursion.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {excursion.tags.map((t) => (
              <Badge key={t} variant="secondary" className="capitalize">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </header>

      {excursion?.cover_image && (
        <div className="relative h-72 w-full overflow-hidden rounded-xl border">
          <SafeImage
            src={resolveImageUrl(excursion.cover_image)}
            alt={excursion.name}
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Itinerary</h2>
        {flow.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {flow.map((row, idx) => {
              if (row.kind === "item") {
                const it = row.it;
                return (
                  <div
                    key={`it-${idx}`}
                    className="overflow-hidden rounded-xl border bg-card/60"
                  >
                    <div className="p-4 flex items-start gap-4">
                      {it.displayImage ? (
                        <div className="relative h-16 w-16 rounded-full overflow-hidden border flex-none">
                          <SafeImage
                            src={it.displayImage}
                            alt={it.displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-muted border flex-none" />
                      )}
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">
                            {String(it.item_type || "").replace("_", " ")}
                          </Badge>
                          {typeof it.duration_minutes === "number" &&
                            it.duration_minutes > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {it.duration_minutes} min
                              </span>
                            )}
                        </div>
                        <p className="font-medium truncate">{it.displayName}</p>
                        {it.displaySummary && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {it.displaySummary}
                          </p>
                        )}
                        {it.details && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {it.details}
                          </p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap">
                          {it.maps_url && (
                            <a
                              href={it.maps_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs underline"
                            >
                              Maps link
                            </a>
                          )}
                          {it.opening_times_url && (
                            <a
                              href={it.opening_times_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs underline"
                            >
                              Opening times
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              const leg = row.leg;
              return (
                <div
                  key={`leg-${idx}`}
                  className="rounded-lg bg-muted p-3 text-sm"
                >
                  <div className="font-medium">
                    {leg.title || leg.primary_mode || "Transport"}
                  </div>
                  {leg.summary && <p className="mt-1">{leg.summary}</p>}
                  {(leg.est_duration_min || leg.est_cost_min) && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {leg.est_duration_min
                        ? `~${leg.est_duration_min} min`
                        : ""}
                      {leg.est_cost_min
                        ? ` · ${leg.currency || "JPY"} ${leg.est_cost_min}${
                            leg.est_cost_max ? `–${leg.est_cost_max}` : ""
                          }`
                        : ""}
                    </div>
                  )}
                  {leg.maps_url && (
                    <a
                      href={leg.maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs underline"
                    >
                      Maps link
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

