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
    const t = String(it.item_type || "").toLowerCase();
    if (!t) return acc;
    acc[t] = acc[t] || new Set();
    if (it.ref_id) acc[t].add(it.ref_id);
    return acc;
  }, {});

  async function fetchMap(table, cols, ids) {
    if (!ids || ids.length === 0) return new Map();
    const { data } = await db.from(table).select(cols).in("id", Array.from(ids));
    const map = new Map();
    for (const row of data || []) map.set(row.id, row);
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
  if (buckets.sight) {
    maps.sight = await fetchMap(
      "sights",
      "id, name, summary, description, images, duration_minutes, maps_url",
      buckets.sight
    );
  }
  if (buckets.experience) {
    maps.experience = await fetchMap(
      "experiences",
      "id, name, summary, description, images, duration_minutes, maps_url",
      buckets.experience
    );
  }
  if (buckets.tour) {
    maps.tour = await fetchMap(
      "tours",
      "id, name, summary, description, images, duration_minutes, maps_url",
      buckets.tour
    );
  }

  return list.map((it) => {
    const t = String(it.item_type || "").toLowerCase();
    const m = maps[t];
    const row = m ? m.get(it.ref_id) : null;
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
    };
  });
}

export async function getExcursionByIdentifierPublic(identifier) {
  const db = getPublicDB();

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
  if (!match) {
    const { data, error } = await db
      .from("excursions")
      .select(
        "id, slug, name, summary, description, transport, maps_url, cover_image, updated_at, status"
      )
      .eq("status", "published")
      .eq("id", String(identifier))
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

