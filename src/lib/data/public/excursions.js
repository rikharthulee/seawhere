import { getPublicDB } from "@/lib/supabase/public";

function slugify(input) {
  return (
    String(input || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || null
  );
}

export async function listPublishedExcursions() {
  const db = getPublicDB();
  const { data, error } = await db
    .from("excursions")
    .select(
      "id, slug, name, summary, description, transport, maps_url, cover_image, updated_at, status"
    )
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

async function hydrateExcursionItems(db, excursionId) {
  const { data: items, error } = await db
    .from("excursion_items")
    .select("id, excursion_id, ref_id, item_type, sort_order")
    .eq("excursion_id", excursionId)
    .order("sort_order", { ascending: true })
    .limit(500);
  if (error) throw error;
  const list = items ?? [];
  if (list.length === 0) return [];

  const buckets = list.reduce((acc, it) => {
    const t = String(it.item_type || "").toLowerCase().trim();
    if (!t) return acc;
    acc[t] = acc[t] || new Set();
    if (it.ref_id) acc[t].add(it.ref_id);
    return acc;
  }, {});

  const normId = (v) => String(v || "").trim().toLowerCase();

  async function fetchMap(table, cols, ids) {
    if (!ids || ids.length === 0) return new Map();
    const { data } = await db
      .from(table)
      .select(cols)
      .in("id", Array.from(ids))
      .order("id", { ascending: true });
    const map = new Map();
    for (const row of data || []) map.set(normId(row.id), row);
    return map;
  }

  function firstImageFromImages(images) {
    if (!images) return null;
    const arr = Array.isArray(images) ? images : [];
    for (const entry of arr) {
      if (!entry) continue;
      if (typeof entry === "string") return entry;
      if (typeof entry === "object") {
        if (entry.url) return entry.url;
        if (entry.src) return entry.src;
        if (entry.image) return entry.image;
      }
    }
    return null;
  }

  const maps = {};
  const tableByKind = { sight: "sights", experience: "experiences", tour: "tours" };
  for (const kind of Object.keys(buckets)) {
    const table = tableByKind[kind];
    if (!table) continue;
    maps[kind] = await fetchMap(
      table,
      "id, slug, name, summary, description, images, duration_minutes, maps_url, opening_times_url",
      buckets[kind]
    );
  }

  const cols = "id, slug, name, summary, description, images, duration_minutes, maps_url, opening_times_url";
  const resolved = await Promise.all(
    list.map(async (it) => {
      const t = String(it.item_type || "").toLowerCase().trim();
      const m = maps[t];
      let row = m ? m.get(normId(it.ref_id)) || null : null;
      if (!row && tableByKind[t]) {
        // Fallback: direct fetch by id (handles edge cases with type/ID normalization)
        const { data } = await db
          .from(tableByKind[t])
          .select(cols)
          .eq("id", it.ref_id)
          .maybeSingle();
        row = data || null;
      }
      const displayName = row?.name || it.name || it.title || t || "Item";
      let displaySummary = null;
      if (row?.summary) displaySummary = row.summary;
      else if (typeof row?.description === "string" && row.description) {
        displaySummary = row.description;
      }
      const image = firstImageFromImages(row?.images);
      return {
        ...it,
        displayName,
        displaySummary,
        displayImage: image || null,
        duration_minutes: row?.duration_minutes ?? null,
        maps_url: row?.maps_url || null,
        opening_times_url: row?.opening_times_url || null,
        slug: row?.slug || null,
      };
    })
  );
  return resolved;
}

export async function getExcursionByIdentifierPublic(identifier) {
  const db = getPublicDB();

  const isUuid = (val) =>
    typeof val === "string" &&
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
      val.trim()
    );

  async function fetchBySlug(slug) {
    const { data, error } = await db
      .from("excursions")
      .select(
        "id, slug, name, summary, description, transport, maps_url, cover_image, updated_at, status"
      )
      .eq("status", "published")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  let match = null;
  if (identifier) {
    match = await fetchBySlug(String(identifier).trim().toLowerCase());
  }
  if (!match && isUuid(identifier)) {
    const { data, error } = await db
      .from("excursions")
      .select(
        "id, slug, name, summary, description, transport, maps_url, cover_image, updated_at, status"
      )
      .eq("status", "published")
      .eq("id", identifier.trim())
      .maybeSingle();
    if (error) throw error;
    match = data || null;
  }

  if (!match) {
    const slugCandidate = slugify(identifier);
    if (slugCandidate) {
      const { data } = await db
        .from("excursions")
        .select(
          "id, slug, name, summary, description, transport, maps_url, cover_image, updated_at, status"
        )
        .eq("status", "published");
      match = (data || []).find((row) => {
        const explicit = String(row.slug || "").toLowerCase().trim();
        const generated = slugify(row.name || row.title || row.id);
        return explicit === slugCandidate || generated === slugCandidate;
      }) || null;
    }
  }

  if (!match) return null;

  const items = await hydrateExcursionItems(db, match.id);

  return { excursion: match, detailedItems: items };
}
