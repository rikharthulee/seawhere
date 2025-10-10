import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import SafeImage from "@/components/SafeImage";
import { resolveImageUrl } from "@/lib/imageUrl";
import { getCuratedExcursionBySlugPublic } from "@/lib/data/public/excursions";

export const revalidate = 300; // ISR every 5 minutes

const COST_BAND_LABELS = {
  budget: "€ (budget)",
  midrange: "€€ (mid)",
  premium: "€€€ (high)",
};

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
  const isNote = (it?.item_type || "").toLowerCase() === "note";
  const noteTitle = isNote ? (e?.title || it?.title || "Note") : null;
  const noteDetails = isNote ? (e?.details ?? it?.details ?? "") : null;
  const displayImage = isNote
    ? null
    : resolveImageUrl(firstImage(e?.images) || firstImage(it?.images));
  return {
    ...it,
    isNote,
    displayName: isNote
      ? noteTitle
      : e?.name || it?.name || "(untitled)",
    displaySummary: isNote
      ? noteDetails || ""
      : e?.summary || it?.summary || "",
    opening_times_url: isNote
      ? null
      : e?.opening_times_url || it?.opening_times_url || null,
    displayImage,
    details: isNote ? noteDetails : it?.details || null,
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
        {(Array.isArray(excursion?.tags) && excursion.tags.length > 0) ||
        excursion?.cost_band ||
        excursion?.wheelchair_friendly ||
        excursion?.good_with_kids ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.isArray(excursion?.tags) &&
              excursion.tags.map((t) => (
                <Badge key={`tag-${t}`} variant="secondary" className="capitalize">
                  {t}
                </Badge>
              ))}
            {excursion?.cost_band &&
              (COST_BAND_LABELS[excursion.cost_band] || excursion.cost_band) && (
                <Badge
                  key="meta-cost"
                  variant="outline"
                  className="capitalize"
                >
                  {COST_BAND_LABELS[excursion.cost_band] || excursion.cost_band}
                </Badge>
              )}
            {excursion?.wheelchair_friendly ? (
              <Badge key="meta-accessible" variant="secondary">
                Accessible
              </Badge>
            ) : null}
            {excursion?.good_with_kids ? (
              <Badge key="meta-kids" variant="secondary">
                Good with kids
              </Badge>
            ) : null}
          </div>
        ) : null}
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

      {excursion?.notes ? (
        <section className="space-y-2 rounded-xl border bg-card/40 p-4">
          <h2 className="text-xl font-semibold">Notes</h2>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {excursion.notes}
          </p>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Itinerary</h2>
        {flow.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {flow.map((row, idx) => {
              if (row.kind === "item") {
                const it = row.it;
                if (it.isNote) {
                  const hasCustomTitle =
                    it.displayName && it.displayName.trim().toLowerCase() !== "note";
                  return (
                    <div
                      key={`note-${idx}`}
                      className="rounded-xl border border-dashed bg-muted/50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Badge variant="outline">Note</Badge>
                        <div className="flex-1 space-y-2 min-w-0">
                          {hasCustomTitle ? (
                            <p className="font-medium">{it.displayName}</p>
                          ) : null}
                          {it.details ? (
                            <p className="text-sm text-muted-foreground whitespace-pre-line">
                              {it.details}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No details yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
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
                            leg.est_cost_max ? `-${leg.est_cost_max}` : ""
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
