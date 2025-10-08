import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import { resolveImageUrl } from "@/lib/imageUrl";
import { Badge } from "@/components/ui/badge";
import { getExcursionByIdentifierPublic } from "@/lib/data/public/excursions";

// Normalize a possibly nested entity to a simple display object
function firstImage(srcLike) {
  if (!srcLike) return null;
  if (typeof srcLike === "string") return srcLike;
  if (Array.isArray(srcLike) && srcLike.length) {
    const first = srcLike[0];
    if (typeof first === "string") return first;
    if (first?.src) return first.src;
  }
  if (srcLike?.src) return srcLike.src;
  return null;
}

function normalizeDetailedItem(it) {
  const entity = it?.entity || null;
  const name = it?.displayName || entity?.name || it?.name || null;
  const summary = it?.displaySummary || entity?.summary || it?.summary || null;
  const openingTimes =
    it?.opening_times_url || entity?.opening_times_url || null;
  const imgCandidate =
    it?.displayImage ||
    firstImage(entity?.images) ||
    firstImage(it?.images) ||
    null;
  return {
    ...it,
    displayName: name,
    displaySummary: summary,
    opening_times_url: openingTimes,
    displayImage: resolveImageUrl(imgCandidate),
  };
}

export const runtime = "nodejs";
export const revalidate = 300;
export const dynamic = undefined;

function extractSummary(row) {
  if (!row) return null;
  if (typeof row.summary === "string" && row.summary.trim()) return row.summary;
  if (typeof row.description === "string" && row.description.trim()) {
    return row.description;
  }
  if (typeof row.description === "object" && row.description !== null) {
    // Common shapes: { text }, { summary }, rich-text docs, etc.
    if (
      typeof row.description.text === "string" &&
      row.description.text.trim()
    ) {
      return row.description.text;
    }
    if (
      typeof row.description.summary === "string" &&
      row.description.summary.trim()
    ) {
      return row.description.summary;
    }
  }
  return null;
}

function extractNotes(row) {
  // Accept notes from several possible shapes:
  // 1) row.notes: string[] | {text:string}[]
  // 2) row.description.notes: same as above
  // 3) row.description.highlights: same as above
  const collect = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val
        .map((entry) =>
          typeof entry === "string" ? entry : String(entry?.text || "").trim()
        )
        .filter(Boolean);
    }
    return [];
  };

  const fromTopLevel = collect(row?.notes);
  const fromDescNotes = collect(row?.description?.notes);
  const fromDescHighlights = collect(row?.description?.highlights);

  return [...fromTopLevel, ...fromDescNotes, ...fromDescHighlights];
}

function normalizeTransport(value) {
  // Normalizes various shapes into an array of entries.
  // Accepts: array, object with `items`, JSON string, or single object.
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.items)
        ? parsed.items
        : parsed && typeof parsed === "object"
        ? [parsed]
        : [];
    } catch {
      return [];
    }
  }
  if (typeof value === "object") {
    if (Array.isArray(value.items)) return value.items;
    return [value];
  }
  return [];
}

function pickItemDisplay(entry) {
  const title = entry.item_type ? `${entry.item_type}` : "Item";
  const subtitle = entry.ref_id ? `Ref: ${entry.ref_id}` : null;

  let href = null;
  if (entry.item_type && entry.ref_id) {
    const type = String(entry.item_type).toLowerCase();
    href = `/${type}s/${entry.ref_id}`;
  }

  return { title, subtitle, image: null, href };
}

export default async function ExcursionDetailPage(props) {
  const params = (await props.params) || {};
  const searchParams = props.searchParams
    ? await props.searchParams
    : undefined;

  const slugParam = decodeURIComponent(params?.slug || "")
    .trim()
    .toLowerCase();
  const dbgFlagRaw = String(searchParams?.debug || "").toLowerCase();
  const debugOn =
    dbgFlagRaw === "1" || dbgFlagRaw === "true" || dbgFlagRaw === "yes";

  const result = await getExcursionByIdentifierPublic(slugParam);
  if (!result?.excursion) return notFound();
  const { excursion: match, detailedItems } = result;

  // Image fallbacks: cover_image -> hero_image -> images[0]
  const coverCandidate = match.cover_image;
  const imageSrc = resolveImageUrl(coverCandidate);

  const summary = extractSummary(match);
  const notes = extractNotes(match);
  const transportEntries = normalizeTransport(match.transport);

  // Map URL may live in description
  const mapUrl =
    match.maps_url ||
    (typeof match.description === "object" && match.description !== null
      ? match.description.map_url || match.description.maps_url
      : null);

  // Group items by type/collection for display
  const grouped = (Array.isArray(detailedItems) ? detailedItems : []).reduce(
    (acc, it) => {
      const key = (it.collection || it.item_type || "items")
        .toString()
        .toLowerCase();
      acc[key] = acc[key] || [];
      acc[key].push(it);
      return acc;
    },
    {}
  );

  const orderedGroups = [
    "sights",
    "experiences",
    "restaurants",
    "accommodation",
    "hotels",
    "items",
  ].filter((k) => grouped[k]?.length);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {match.name || "Untitled excursion"}
        </h1>
        {summary ? (
          <p className="text-base text-muted-foreground sm:text-lg">
            {summary}
          </p>
        ) : null}
        {match.updated_at ? (
          <p className="text-xs text-muted-foreground">
            Updated{" "}
            {new Date(match.updated_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        ) : null}
      </header>

      {imageSrc ? (
        <div className="relative h-72 w-full overflow-hidden rounded-xl border border-border">
          <SafeImage
            src={imageSrc}
            alt={match.name || "Excursion hero"}
            fill
            sizes="(min-width: 1024px) 800px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Itinerary</h2>
        {(() => {
          const itemsWithSort = (detailedItems || []).map((it) => ({
            kind: "item",
            sort: Number(it.sort_order) || 0,
            it,
          }));
          const legsWithSort = (transportEntries || []).map((t, i) => ({
            kind: "leg",
            sort: Number(t.sort_order ?? i * 10) || i * 10,
            t,
          }));
          const flow = [...itemsWithSort, ...legsWithSort].sort(
            (a, b) => a.sort - b.sort
          );
          if (flow.length === 0) {
            return (
              <p className="text-sm text-muted-foreground">No items yet.</p>
            );
          }
          return (
            <div className="mt-3 space-y-3">
              {flow.map((row, idx) => {
                if (row.kind === "item") {
                  const itRaw = row.it;
                  const it = normalizeDetailedItem(itRaw);
                  return (
                    <div
                      key={`it-${it.id || itRaw.id || idx}-${idx}`}
                      className="overflow-hidden rounded-xl border border-border bg-card/60"
                    >
                      <div className="p-4 flex items-start gap-4">
                        {it.displayImage ? (
                          <div className="relative h-16 w-16 rounded-full overflow-hidden border flex-none">
                            <SafeImage
                              src={it.displayImage}
                              alt={it.displayName || "Item image"}
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
                            it.duration_minutes > 0 ? (
                              <span className="text-xs text-muted-foreground">
                                {it.duration_minutes} min
                              </span>
                            ) : null}
                          </div>
                          <p className="font-medium truncate">
                            {it.displayName || "(untitled)"}
                          </p>
                          {it.displaySummary ? (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {it.displaySummary}
                            </p>
                          ) : null}
                          {it.details ? (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {it.details}
                            </p>
                          ) : null}
                          <div className="flex items-center gap-3 flex-wrap">
                            {it.maps_url ? (
                              <a
                                href={it.maps_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary underline"
                              >
                                Maps link
                              </a>
                            ) : null}
                            {it.opening_times_url ? (
                              <a
                                href={it.opening_times_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary underline"
                              >
                                Opening times
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      {debugOn && !it.entity && (
                        <div className="border-t border-border bg-amber-50/40 px-4 py-2 text-xs text-amber-900">
                          Entity not resolved (check ref_id/visibility):{" "}
                          {String(itRaw?.item_type)} · {String(itRaw?.ref_id)}
                        </div>
                      )}
                    </div>
                  );
                }
                const t = row.t;
                const title =
                  t.title || t.mode || t.primary_mode || "Transport";
                return (
                  <div
                    key={`leg-${idx}`}
                    className="rounded-lg border border-border bg-card/60 p-4 text-sm text-muted-foreground"
                  >
                    <p className="font-medium text-foreground">{title}</p>
                    {t.details || t.summary ? (
                      <p className="text-xs mt-1">{t.details || t.summary}</p>
                    ) : null}
                    {t.duration_minutes ||
                    t.est_duration_min ||
                    t.est_cost_min ? (
                      <div className="text-xs mt-2">
                        {t.duration_minutes || t.est_duration_min
                          ? `~${t.duration_minutes || t.est_duration_min} min`
                          : null}
                        {t.est_cost_min
                          ? ` · ${t.currency || "JPY"} ${t.est_cost_min}${
                              t.est_cost_max ? `–${t.est_cost_max}` : ""
                            }`
                          : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>

      {notes.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Highlights</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {notes.map((entry, idx) => (
              <li key={idx}>{entry}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Transport is now interleaved above */}

      {mapUrl ? (
        <section className="space-y-2 text-sm">
          <h2 className="text-2xl font-semibold">Map</h2>
          <a
            href={mapUrl}
            className="text-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            View itinerary map
          </a>
        </section>
      ) : null}

      {debugOn ? (
        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold">Debug data</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium">Excursion</h3>
              <pre className="mt-2 max-h-96 overflow-auto rounded border border-border bg-muted p-3 text-xs">
                {JSON.stringify(match, null, 2)}
              </pre>
            </div>
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium">Detailed Items</h3>
              <pre className="mt-2 max-h-96 overflow-auto rounded border border-border bg-muted p-3 text-xs">
                {JSON.stringify(detailedItems, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
