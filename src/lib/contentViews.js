import { getPublicDB } from "@/lib/supabase/public";
import {
  EXPERIENCE_PUBLIC_COLUMNS,
  SIGHT_PUBLIC_COLUMNS,
  TOUR_PUBLIC_COLUMNS,
} from "@/lib/data/public/selects";
import { CONTENT_TYPES } from "@/lib/contentViews/shared";

const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

const POPULAR_CONFIG = {
  [CONTENT_TYPES.DESTINATION]: {
    table: "destinations",
    select: "id, slug, name, summary, images, country_id, countries ( slug )",
    applyFilters: (query) => query.eq("status", "published"),
  },
  [CONTENT_TYPES.SIGHT]: {
    table: "sights",
    select: `${SIGHT_PUBLIC_COLUMNS}, destinations ( slug, countries ( slug ) )`,
    applyFilters: (query) => query.eq("status", "published"),
  },
  [CONTENT_TYPES.EXPERIENCE]: {
    table: "experiences",
    select: `${EXPERIENCE_PUBLIC_COLUMNS}, destinations ( slug, countries ( slug ) )`,
    applyFilters: (query) => query.eq("status", "published"),
  },
  [CONTENT_TYPES.FOOD_DRINK]: {
    table: "food_drink",
    select:
      "id, slug, name, description, images, status, type, price_band, rating, booking_url, address, destination_id, country_id, destinations ( slug, countries ( slug ) )",
    applyFilters: (query) => query.eq("status", "published"),
  },
  [CONTENT_TYPES.ACCOMMODATION]: {
    table: "accommodation",
    select:
      "id, slug, name, summary, description, images, status, price_band, rating, affiliate_url, destination_id, country_id, destinations ( slug, countries ( slug ) )",
    applyFilters: (query) => query.eq("status", "published"),
  },
  [CONTENT_TYPES.TOUR]: {
    table: "tours",
    select: `${TOUR_PUBLIC_COLUMNS}, destinations ( slug, countries ( slug ) )`,
    applyFilters: (query) => query.eq("status", "published"),
  },
  [CONTENT_TYPES.TRIP]: {
    table: "trips",
    select:
      "id, title, summary, visibility, country_id, destination_id, countries ( slug ), destinations ( slug )",
    applyFilters: (query) => query.eq("visibility", "public"),
  },
};

function orderByIds(items, ids) {
  if (!Array.isArray(items)) return [];
  const map = new Map(items.map((item) => [item.id, item]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

export async function fetchPopularContentByType(type, limit = 6) {
  const config = POPULAR_CONFIG[type];
  if (!config) return [];
  const db = getPublicDB();
  const cutoff = new Date(Date.now() - DAYS_30).toISOString();
  const { data: views } = await db
    .from("content_views")
    .select("content_id, views_total, last_viewed_at")
    .eq("content_type", type)
    .gte("last_viewed_at", cutoff)
    .order("views_total", { ascending: false })
    .limit(limit);

  const ids = (views || []).map((row) => row.content_id).filter(Boolean);
  if (ids.length === 0) return [];

  let query = db.from(config.table).select(config.select).in("id", ids);
  if (config.applyFilters) {
    query = config.applyFilters(query);
  }
  const { data: items } = await query;
  return orderByIds(items || [], ids);
}

export async function fetchPopularContent(limitPerType = 4) {
  const entries = [
    ["destinations", CONTENT_TYPES.DESTINATION],
    ["sights", CONTENT_TYPES.SIGHT],
    ["experiences", CONTENT_TYPES.EXPERIENCE],
    ["food", CONTENT_TYPES.FOOD_DRINK],
    ["accommodation", CONTENT_TYPES.ACCOMMODATION],
    ["tours", CONTENT_TYPES.TOUR],
    ["trips", CONTENT_TYPES.TRIP],
  ];

  const results = await Promise.all(
    entries.map(([, type]) => fetchPopularContentByType(type, limitPerType))
  );

  return entries.reduce((acc, [key], idx) => {
    acc[key] = results[idx] || [];
    return acc;
  }, {});
}
