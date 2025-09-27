import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import { createServiceClient } from "@/lib/supabase/service";
import { resolveImageUrl } from "@/lib/imageUrl";
import { getRouteParams } from "@/lib/route-params";
import { Badge } from "@/components/ui/badge";

export const runtime = "nodejs";
export const revalidate = 300;

function slugify(input) {
  return (
    String(input || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || "excursion"
  );
}

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

async function fetchExcursions(includeDrafts = false) {
  const supabase = createServiceClient();

  let query = supabase
    .from("excursions")
    .select(
      "id, slug, name, summary, description, transport, maps_url, cover_image, updated_at, status, destination_id, created_at"
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (!includeDrafts) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchExcursionItems(excursionId) {
  const supabase = createServiceClient();
  // Be permissive with columns because schema may evolve
  const { data, error } = await supabase
    .from("excursion_items")
    .select("id, excursion_id, ref_id, item_type, sort_order")
    .eq("excursion_id", excursionId)
    .order("sort_order", { ascending: true })
    .limit(500);

  if (error) {
    throw error;
  }
  return data || [];
}

async function hydrateItemsFromRefs(items) {
  const supabase = createServiceClient();
  if (!Array.isArray(items) || items.length === 0) return [];

  // Group ref_ids by item_type
  const buckets = items.reduce((acc, it) => {
    const t = String(it.item_type || "").toLowerCase();
    if (!t) return acc;
    acc[t] = acc[t] || new Set();
    if (it.ref_id) acc[t].add(it.ref_id);
    return acc;
  }, {});

  // Helper: build id -> row map for a table
  async function fetchMap(table, cols, ids) {
    if (!ids || ids.length === 0) return new Map();
    const { data, error } = await supabase
      .from(table)
      .select(cols)
      .in("id", ids);
    if (error || !data) return new Map();
    const m = new Map();
    for (const row of data) m.set(row.id, row);
    return m;
  }

  // Helper: pull first usable URL from a JSONB `images` field
  function firstImageFromImages(images) {
    if (!images) return null;
    try {
      const arr = Array.isArray(images) ? images : [];
      for (const img of arr) {
        if (typeof img === "string" && img) return img;
        if (img && typeof img === "object") {
          // common shapes: {url}, {src}, {image}
          if (typeof img.url === "string" && img.url) return img.url;
          if (typeof img.src === "string" && img.src) return img.src;
          if (typeof img.image === "string" && img.image) return img.image;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  // Build maps per supported type based on your schema
  const maps = {};

  // sights: id, name, summary, images (unified image handling)
  if (buckets.sight && buckets.sight.size > 0) {
    maps.sight = await fetchMap(
      "sights",
      "id, name, summary, images",
      Array.from(buckets.sight)
    );
  }

  // experiences: id, name, summary, description, images
  if (buckets.experience && buckets.experience.size > 0) {
    maps.experience = await fetchMap(
      "experiences",
      "id, name, summary, description, images",
      Array.from(buckets.experience)
    );
  }

  // tours: id, name, summary, description, images
  if (buckets.tour && buckets.tour.size > 0) {
    maps.tour = await fetchMap(
      "tours",
      "id, name, summary, description, images",
      Array.from(buckets.tour)
    );
  }

  // Merge details onto items
  return items.map((it) => {
    const t = String(it.item_type || "").toLowerCase();
    const m = maps[t];
    const row = m ? m.get(it.ref_id) : null;

    // Name
    const displayName = row?.name || it.name || it.title || t || "Item";

    // Summary (prefer `summary`, fallback to text `description`)
    let displaySummary = null;
    if (row?.summary) displaySummary = row.summary;
    else if (typeof row?.description === "string" && row.description) {
      displaySummary = row.description;
    }

    // Image
    let image = null;
    if (t === "sight" || t === "experience" || t === "tour") {
      image = firstImageFromImages(row?.images);
    }
    const displayImage = resolveImageUrl(image);

    return { ...it, displayName, displaySummary, displayImage };
  });
}

export default async function ExcursionDetailPage(props) {
  let routeCtx = {};
  try {
    routeCtx = (await getRouteParams(props)) || {};
  } catch (_) {
    routeCtx = {};
  }
  const params = routeCtx.params || props?.params || {};
  const searchParams = routeCtx.searchParams || props?.searchParams || {};

  const includeDrafts = String(searchParams?.preview) === "1";
  const slugParam = decodeURIComponent(params?.slug || "")
    .trim()
    .toLowerCase();

  const dbgFlagRaw = String(searchParams?.debug || "").toLowerCase();
  const debugOn =
    dbgFlagRaw === "1" || dbgFlagRaw === "true" || dbgFlagRaw === "yes";

  const excursions = await fetchExcursions(includeDrafts);

  if (!excursions || excursions.length === 0) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 space-y-6">
        <h1 className="text-2xl font-semibold">Excursions</h1>
        <p className="text-sm text-muted-foreground">
          No excursions found{includeDrafts ? " (including drafts)" : ""}.
        </p>
        {debugOn ? (
          <pre className="mt-2 max-h-96 overflow-auto rounded border border-border bg-muted p-3 text-xs">
            {JSON.stringify({ includeDrafts, slugParam, excursions }, null, 2)}
          </pre>
        ) : null}
      </main>
    );
  }

  const match = excursions.find((row) => {
    const explicitSlug = String(row.slug || "")
      .trim()
      .toLowerCase();
    const generatedSlug = slugify(row.name || row.title || row.id);
    if (explicitSlug && explicitSlug === slugParam) return true;
    if (generatedSlug === slugParam) return true;
    if (String(row.id).toLowerCase() === slugParam) return true;
    return false;
  });

  if (!match) {
    if (!includeDrafts) return notFound();
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10 space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Excursion not found
          </h1>
          <p className="text-sm text-muted-foreground">
            Try adding <code>?preview=1</code> when testing drafts.
          </p>
        </header>
      </main>
    );
  }

  const items = await fetchExcursionItems(match.id);
  const itemsSorted = Array.isArray(items)
    ? [...items].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    : [];
  const detailedItems = await hydrateItemsFromRefs(itemsSorted);

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
  const grouped = items.reduce((acc, it) => {
    const key = (it.collection || it.item_type || "items")
      .toString()
      .toLowerCase();
    acc[key] = acc[key] || [];
    acc[key].push(it);
    return acc;
  }, {});

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
        {detailedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {detailedItems.map((it) => (
              <div
                key={it.id}
                className="overflow-hidden rounded-xl border border-border bg-card/60"
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
                      it.duration_minutes > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {it.duration_minutes} min
                        </span>
                      ) : null}
                    </div>

                    <p className="font-medium truncate">{it.displayName}</p>

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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

      {transportEntries.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Suggested Transport</h2>
          <div className="space-y-3">
            {transportEntries.map((entry, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-card/60 p-4 text-sm text-muted-foreground"
              >
                {entry.title ? (
                  <p className="font-medium text-foreground">{entry.title}</p>
                ) : null}
                <ul className="mt-2 space-y-1 text-xs">
                  {entry.mode ? <li>Mode: {entry.mode}</li> : null}
                  {entry.duration_minutes ? (
                    <li>Duration: {entry.duration_minutes} minutes</li>
                  ) : null}
                  {entry.details ? <li>{entry.details}</li> : null}
                  {!entry.title &&
                  !entry.mode &&
                  !entry.duration_minutes &&
                  !entry.details ? (
                    <li>
                      {typeof entry === "string"
                        ? entry
                        : JSON.stringify(entry)}
                    </li>
                  ) : null}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

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
            <div>
              <h3 className="text-sm font-medium">Items</h3>
              <pre className="mt-2 max-h-96 overflow-auto rounded border border-border bg-muted p-3 text-xs">
                {JSON.stringify(items, null, 2)}
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
