import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import SafeImage from "@/components/SafeImage";
import { resolveImageUrl } from "@/lib/imageUrl";
import { getCuratedDayItineraryBySlugPublic } from "@/lib/data/public/itineraries";

export const revalidate = 300; // ISR every 5 minutes

const COST_BAND_LABELS = {
  budget: "€ (budget)",
  midrange: "€€ (mid)",
  premium: "€€€ (high)",
};

function firstParagraph(value) {
  try {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === "string" && entry.trim()) return entry.trim();
        if (entry && typeof entry === "object" && typeof entry.text === "string" && entry.text.trim()) {
          return entry.text.trim();
        }
      }
      return "";
    }
    if (typeof value === "object") {
      if (value.type === "paragraph") {
        const nodes = Array.isArray(value.content) ? value.content : [];
        const text = nodes.map((n) => n?.text || "").join("").trim();
        if (text) return text;
      }
      if (value.type === "doc" && Array.isArray(value.content)) {
        for (const node of value.content) {
          if (node?.type === "paragraph") {
            const nodes = Array.isArray(node.content) ? node.content : [];
            const text = nodes.map((n) => n?.text || "").join("").trim();
            if (text) return text;
          }
        }
      }
      if (typeof value.summary === "string" && value.summary.trim()) {
        return value.summary.trim();
      }
      if (typeof value.text === "string" && value.text.trim()) {
        return value.text.trim();
      }
    }
  } catch {}
  return "";
}

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
  const noteTitle = isNote ? e?.title || it?.title || "Note" : null;
  const noteDetails = isNote ? e?.details ?? it?.details ?? "" : null;
  const displayImage = isNote
    ? null
    : resolveImageUrl(firstImage(e?.images) || firstImage(it?.images));
  const entitySummary =
    e?.summary ||
    (e?.description ? firstParagraph(e.description) : "");
  return {
    ...it,
    isNote,
    displayName: isNote ? noteTitle : e?.name || it?.name || "(untitled)",
    displaySummary: isNote
      ? noteDetails || ""
      : entitySummary || it?.summary || "",
    opening_times_url: isNote
      ? null
      : e?.opening_times_url || it?.opening_times_url || null,
    displayImage,
    details: isNote
      ? noteDetails
      : typeof it?.details === "string" && it.details.trim().length > 0
        ? it.details
        : null,
  };
}

export default async function Page({ params, searchParams }) {
  const { slug } = await params;
  const { debug } = (await searchParams) || {};
  const { dayItinerary, items, transport } = await getCuratedDayItineraryBySlugPublic(
    slug
  );
  if (!dayItinerary && !debug) return notFound();

  const normalizedItems = (items || []).map((it) => normalizeItem(it));
  const flow = [
    ...(transport || []).map((leg) => ({
      kind: "leg",
      sort_order: Number.isFinite(leg?.sort_order) ? leg.sort_order : Infinity,
      leg,
    })),
    ...normalizedItems.map((it) => ({
      kind: "item",
      sort_order: Number.isFinite(it?.sort_order) ? it.sort_order : Infinity,
      isNote: it.isNote,
      it,
    })),
  ].sort((a, b) => {
    const orderA = Number.isFinite(a.sort_order) ? a.sort_order : Infinity;
    const orderB = Number.isFinite(b.sort_order) ? b.sort_order : Infinity;
    if (orderA !== orderB) return orderA - orderB;
    const priority = (entry) => {
      if (entry.kind === "leg") return 0;
      if (entry.kind === "item" && !entry.isNote) return 1;
      return 2; // notes last
    };
    return priority(a) - priority(b);
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      {!dayItinerary && debug ? (
        <pre className="rounded-md border bg-muted p-3 text-xs overflow-x-auto">
          {JSON.stringify(
            { slug, debug, dayItinerary, items, transport },
            null,
            2
          )}
        </pre>
      ) : null}
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {dayItinerary ? dayItinerary.name : "Day Itinerary"}
        </h1>
        {dayItinerary?.summary && (
          <p className="text-base text-muted-foreground sm:text-lg">
            {dayItinerary.summary}
          </p>
        )}
        {(Array.isArray(dayItinerary?.tags) && dayItinerary.tags.length > 0) ||
        dayItinerary?.cost_band ||
        dayItinerary?.wheelchair_friendly ||
        dayItinerary?.good_with_kids ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.isArray(dayItinerary?.tags) &&
              dayItinerary.tags.map((t) => (
                <Badge
                  key={`tag-${t}`}
                  variant="secondary"
                  className="capitalize"
                >
                  {t}
                </Badge>
              ))}
            {dayItinerary?.cost_band &&
              (COST_BAND_LABELS[dayItinerary.cost_band] ||
                dayItinerary.cost_band) && (
                <Badge key="meta-cost" variant="outline" className="capitalize">
                  {COST_BAND_LABELS[dayItinerary.cost_band] || dayItinerary.cost_band}
                </Badge>
              )}
            {dayItinerary?.wheelchair_friendly ? (
              <Badge key="meta-accessible" variant="secondary">
                Accessible
              </Badge>
            ) : null}
            {dayItinerary?.good_with_kids ? (
              <Badge key="meta-kids" variant="secondary">
                Good with kids
              </Badge>
            ) : null}
          </div>
        ) : null}
      </header>

      {dayItinerary?.cover_image && (
        <div className="relative h-72 w-full overflow-hidden rounded-xl border">
          <SafeImage
            src={resolveImageUrl(dayItinerary.cover_image)}
            alt={dayItinerary.name}
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Day Itinerary</h2>
        {flow.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {flow.map((row, idx) => {
              if (row.kind === "item") {
                const it = row.it;
                if (it.isNote) {
                  return (
                    <div
                      key={`note-${idx}`}
                      className="rounded-xl border border-dashed bg-muted/50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-2 min-w-0">
                          {it.displayName ? (
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

      {dayItinerary?.notes ? (
        <section className="space-y-2 rounded-xl border bg-card/40 p-4">
          <h2 className="text-xl font-semibold">Notes</h2>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
            {dayItinerary.notes}
          </p>
        </section>
      ) : null}
    </main>
  );
}
