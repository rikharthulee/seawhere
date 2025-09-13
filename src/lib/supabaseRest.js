import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getHeaders() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars"
    );
  }
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

async function supaFetch(pathWithQuery, { revalidate = 60, tags } = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${pathWithQuery}`;
  const next = { revalidate };
  if (Array.isArray(tags) && tags.length) next.tags = tags;
  const res = await fetch(url, {
    headers: getHeaders(),
    next,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchDestinations() {
  const query =
    "destinations?select=slug,name,summary,hero_image,thumbnail_image,status,credit&status=eq.published&order=name.asc";
  return supaFetch(query, { revalidate: 300, tags: ["destinations"] });
}

export async function fetchDestinationBySlugRest(slug) {
  const query = `destinations?slug=eq.${encodeURIComponent(
    slug
  )}&select=slug,name,summary,body_richtext,hero_image,thumbnail_image,status,credit&limit=1`;
  const rows = await supaFetch(query, {
    revalidate: 300,
    tags: ["destinations", `destinations:${slug}`],
  });
  return rows?.[0] || null;
}

export async function fetchAccommodations() {
  const select =
    "slug,name,summary,hero_image,thumbnail_image,status,credit";
  const query = `accommodation?select=${select}&status=eq.published&order=name.asc`;
  return supaFetch(query, { revalidate: 900, tags: ["accommodation"] });
}

export async function fetchAccommodationBySlug(slug) {
  const sel =
    "slug,name,summary,description,hero_image,thumbnail_image,images,status,credit,price_band,rating,website_url,affiliate_url,lat,lng,address,destination_id,prefecture_id,division_id";
  const query = `accommodation?slug=eq.${encodeURIComponent(slug)}&select=${sel}&limit=1`;
  const rows = await supaFetch(query, {
    revalidate: 900,
    tags: ["accommodation", `accommodation:${slug}`],
  });
  return rows?.[0] || null;
}

// Regions / Prefectures / Divisions / Destinations
export async function fetchRegions() {
  const query = "regions?select=id,slug,name,order_index&order=order_index.asc";
  return supaFetch(query, { revalidate: 600, tags: ["regions"] });
}

export async function fetchRegionBySlug(slug) {
  const query = `regions?slug=eq.${encodeURIComponent(slug)}&select=id,slug,name&limit=1`;
  const rows = await supaFetch(query, { revalidate: 600, tags: ["regions", `regions:${slug}`] });
  return rows?.[0] || null;
}

// (moved below) fetchRegionById

export async function fetchPrefectures() {
  const query = "prefectures?select=id,slug,name,region_id,order_index&order=order_index.asc";
  return supaFetch(query, { revalidate: 600, tags: ["prefectures"] });
}

export async function fetchPrefectureBySlug(slug, regionId) {
  const query = `prefectures?slug=eq.${encodeURIComponent(slug)}&region_id=eq.${encodeURIComponent(
    regionId
  )}&select=id,slug,name,region_id&limit=1`;
  const rows = await supaFetch(query, { revalidate: 600, tags: ["prefectures", `prefectures:${slug}`] });
  return rows?.[0] || null;
}

// (moved below) fetchPrefectureById

export async function fetchDivisionsByPrefecture(prefId) {
  const query = `divisions?prefecture_id=eq.${encodeURIComponent(prefId)}&select=id,slug,name,order_index&order=order_index.asc`;
  return supaFetch(query, { revalidate: 600, tags: ["divisions", `divisions:pref:${prefId}`] });
}

export async function fetchDivisionBySlug(slug, prefId) {
  const query = `divisions?slug=eq.${encodeURIComponent(slug)}&prefecture_id=eq.${encodeURIComponent(
    prefId
  )}&select=id,slug,name,prefecture_id&limit=1`;
  const rows = await supaFetch(query, { revalidate: 600, tags: ["divisions", `divisions:${slug}`] });
  return rows?.[0] || null;
}

// (moved below) fetchDivisionById

export async function fetchAllDivisions() {
  const query = `divisions?select=id,slug,name,prefecture_id,order_index&order=order_index.asc`;
  return supaFetch(query, { revalidate: 600, tags: ["divisions"] });
}

export async function fetchDestinationsByPrefecture(prefId) {
  const sel = "id,slug,name,summary,hero_image,thumbnail_image,status,credit";
  const query = `destinations?prefecture_id=eq.${encodeURIComponent(
    prefId
  )}&status=eq.published&select=${sel}&order=name.asc`;
  return supaFetch(query, { revalidate: 600, tags: ["destinations", `destinations:pref:${prefId}`] });
}

export async function fetchDestinationsByDivision(divId) {
  const sel = "id,slug,name,summary,hero_image,thumbnail_image,status,credit";
  const query = `destinations?division_id=eq.${encodeURIComponent(
    divId
  )}&status=eq.published&select=${sel}&order=name.asc`;
  return supaFetch(query, { revalidate: 600, tags: ["destinations", `destinations:div:${divId}`] });
}

export async function fetchDestinationBySlug(slug) {
  const s = String(slug || "").trim();
  const { data, error } = await db
    .from("destinations")
    .select(
      "id, slug, name, status, prefecture_id, division_id, hero_image, thumbnail_image, summary, body_richtext, credit, images"
    )
    .eq("slug", s)
    .eq("status", "published")
    .single();
  if (error) return null;
  return data;
}

// Fetch destination by slug without requiring published status (used for sights index pages)
export async function fetchDestinationBySlugLoose(slug) {
  const s = String(slug || "").trim();
  const { data, error } = await db
    .from("destinations")
    .select("id, slug, name, status")
    .eq("slug", s)
    .maybeSingle();
  if (error) return null;
  return data;
}

// Destination related content (legacy POIs)
export async function fetchPOIsByDestination(destId) {
  const { data, error } = await db
    .from("poi")
    .select("id, slug, type, title, summary, image, status")
    .eq("destination_id", destId)
    .eq("status", "published")
    .order("title", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function fetchAllPOIs() {
  const { data, error } = await db
    .from("poi")
    .select("id, slug, type, title, summary, image, destination_id, status, destinations ( slug, name )")
    .eq("status", "published")
    .order("title", { ascending: true });
  if (error) return [];
  return data ?? [];
}

// Fetch POIs by a set of destination IDs
export async function fetchPOIsByDestinationIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const { data, error } = await db
    .from("poi")
    .select("id, slug, type, title, summary, image, destination_id, status")
    .in("destination_id", ids)
    .eq("status", "published")
    .order("title", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function fetchDestinationById(id) {
  if (!id) return null;
  const { data, error } = await db
    .from("destinations")
    .select("id, name, slug, status")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function fetchPOIById(id) {
  if (!id) return null;
  const { data, error } = await db
    .from("poi")
    .select("id, type, title, summary, details, duration_minutes, price, image, provider, deeplink, status, destination_id, lat, lng, timezone, gyg_tour_id")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error) return null;
  return data;
}

// Fetch a POI by destination slug and poi slug (nested route support)
// Note: requires a `slug` column on `public.poi` and uniqueness either
// global or per-destination.
export async function fetchPOIByDestinationAndSlug(destinationSlug, poiSlug) {
  const s = String(destinationSlug || "").trim();
  // Do not require destination to be published here — we only need its ID/name
  // to resolve the POI, which already enforces published status below.
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name")
    .eq("slug", s)
    .maybeSingle();
  if (!dst?.id) return null;
  const { data, error } = await db
    .from("poi")
    .select(
      "id, slug, type, title, summary, details, duration_minutes, price, image, provider, deeplink, status, destination_id, lat, lng, timezone, gyg_tour_id"
    )
    .eq("destination_id", dst.id)
    .eq("slug", poiSlug)
    .eq("status", "published")
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  return { poi: data, destination: dst };
}

export async function fetchPOIOpeningRules(id) {
  if (!id) return [];
  const { data, error } = await db
    .from("poi_opening_rules")
    .select("day_of_week, open_time, close_time")
    .eq("poi_id", id)
    .order("day_of_week", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function fetchPOIOpeningExceptions(id) {
  if (!id) return [];
  const { data, error } = await db
    .from("poi_opening_exceptions")
    .select("start_date, end_date, open_time, close_time, closed, note")
    .eq("poi_id", id)
    .order("start_date", { ascending: true });
  if (error) return [];
  return data ?? [];
}

// New Sights data access
export async function fetchSightsByDestination(destId) {
  const { data, error } = await db
    .from("sights")
    .select("id, slug, name, summary, images, destination_id, status, deeplink, provider, gyg_id, lat, lng")
    .eq("destination_id", destId)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function fetchAllSights() {
  const { data, error } = await db
    .from("sights")
    .select("id, slug, name, summary, images, destination_id, status, deeplink, provider, gyg_id, lat, lng, destinations ( slug, name )")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function fetchSightsByDestinationIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const { data, error } = await db
    .from("sights")
    .select("id, slug, name, summary, images, destination_id, status, deeplink, provider, gyg_id, lat, lng, destinations ( slug, name )")
    .in("destination_id", ids)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function fetchSightByDestinationAndSlug(destinationSlug, sightSlug) {
  const s = String(destinationSlug || "").trim();
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name")
    .eq("slug", s)
    .maybeSingle();
  if (!dst?.id) return null;
  const { data, error } = await db
    .from("sights")
    .select("id, slug, name, summary, description, body_richtext, images, destination_id, lat, lng, status, duration_minutes, provider, deeplink, gyg_id")
    .eq("destination_id", dst.id)
    .eq("slug", sightSlug)
    .eq("status", "published")
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  return { sight: data, destination: dst };
}

export async function fetchSightOpeningHours(id) {
  if (!id) return [];
  const { data, error } = await db
    .from("sight_opening_hours")
    .select("weekday, idx, open_time, close_time, is_closed, valid_from, valid_to")
    .eq("sight_id", id)
    .order("weekday", { ascending: true })
    .order("idx", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function fetchSightOpeningExceptions(id) {
  if (!id) return [];
  const { data, error } = await db
    .from("sight_opening_exceptions")
    .select("date, is_closed, open_time, close_time, note")
    .eq("sight_id", id)
    .order("date", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function fetchAccommodationByDestination(destId) {
  const { data, error } = await db
    .from("accommodation")
    .select("id, name, summary, thumbnail_image, status")
    .eq("destination_id", destId)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function fetchArticlesByDestination(destId) {
  const { data, error } = await db
    .from("articles")
    .select("id, title, excerpt, slug, status, published_at")
    .eq("destination_id", destId)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) return [];
  return data ?? [];
}

export async function fetchDestinationLinksFrom(destId) {
  const { data, error } = await db
    .from("destination_links")
    .select("to_destination_id, relation, weight")
    .eq("from_destination_id", destId)
    .order("weight", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function fetchDestinationsByIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const { data, error } = await db
    .from("destinations")
    .select("id, name, slug, status")
    .in("id", ids)
    .eq("status", "published");
  if (error) return [];
  return data ?? [];
}

// Convenience fetchers for single IDs
export async function fetchPrefectureById(id) {
  if (!id) return null;
  const { data, error } = await db
    .from("prefectures")
    .select("id, name, slug, region_id")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function fetchDivisionById(id) {
  if (!id) return null;
  const { data, error } = await db
    .from("divisions")
    .select("id, name, slug, prefecture_id")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function fetchRegionById(id) {
  if (!id) return null;
  const { data, error } = await db
    .from("regions")
    .select("id, name, slug")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

// Additional helpers for sights indexes
export async function fetchDivisionBySlugLoose(slug) {
  const { data, error } = await db
    .from("divisions")
    .select("id, name, slug, prefecture_id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function fetchPrefecturesByRegion(regionId) {
  const { data, error } = await db
    .from("prefectures")
    .select("id, name, slug, region_id")
    .eq("region_id", regionId)
    .order("order_index", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function fetchDestinationsByPrefectureIds(prefIds = []) {
  if (!Array.isArray(prefIds) || prefIds.length === 0) return [];
  const { data, error } = await db
    .from("destinations")
    .select("id, name, slug, thumbnail_image, status, prefecture_id")
    .in("prefecture_id", prefIds)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data ?? [];
}
