const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

export async function fetchLocations() {
  const query =
    "destinations?select=slug,name,summary,hero_image,thumbnail_image,status,credit&status=eq.published&order=name.asc";
  return supaFetch(query, { revalidate: 300, tags: ["destinations"] });
}

export async function fetchLocationsBySlug(slug) {
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
    "slug,name,summary,description,hero_image,thumbnail_image,images,status,credit";
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

export async function fetchRegionById(id) {
  const query = `regions?id=eq.${encodeURIComponent(id)}&select=id,slug,name&limit=1`;
  const rows = await supaFetch(query, { revalidate: 600, tags: ["regions", `regions:${id}`] });
  return rows?.[0] || null;
}

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

export async function fetchPrefectureById(id) {
  const query = `prefectures?id=eq.${encodeURIComponent(id)}&select=id,slug,name,region_id&limit=1`;
  const rows = await supaFetch(query, { revalidate: 600, tags: ["prefectures", `prefectures:${id}`] });
  return rows?.[0] || null;
}

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

export async function fetchDivisionById(id) {
  const query = `divisions?id=eq.${encodeURIComponent(id)}&select=id,slug,name,prefecture_id&limit=1`;
  const rows = await supaFetch(query, { revalidate: 600, tags: ["divisions", `divisions:${id}`] });
  return rows?.[0] || null;
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
  const sel =
    "id,slug,name,summary,body_richtext,hero_image,thumbnail_image,images,status,credit,prefecture_id,division_id";
  const query = `destinations?slug=eq.${encodeURIComponent(slug)}&status=in.(published,draft)&select=${sel}&limit=1`;
  const rows = await supaFetch(query, { revalidate: 300, tags: ["destinations", `destinations:${slug}`] });
  return rows?.[0] || null;
}

// Destination related content
export async function fetchPOIsByDestination(destId) {
  const sel = "id,title,type,status";
  const query = `poi?destination_id=eq.${encodeURIComponent(destId)}&status=eq.published&select=${sel}&order=title.asc`;
  return supaFetch(query, { revalidate: 300, tags: ["poi", `poi:dest:${destId}`] });
}

export async function fetchAccommodationByDestination(destId) {
  const sel = "id,name,summary,status";
  const query = `accommodation?destination_id=eq.${encodeURIComponent(destId)}&status=eq.published&select=${sel}&order=name.asc`;
  return supaFetch(query, { revalidate: 300, tags: ["accommodation", `accommodation:dest:${destId}`] });
}

export async function fetchArticlesByDestination(destId) {
  const sel = "id,title,excerpt,status";
  const query = `articles?destination_id=eq.${encodeURIComponent(destId)}&status=eq.published&select=${sel}&order=published_at.desc.nullslast`;
  return supaFetch(query, { revalidate: 300, tags: ["articles", `articles:dest:${destId}`] });
}

export async function fetchDestinationLinksFrom(destId) {
  // We assume a view or RPC that joins to destination name/slug; if not, adjust client-side
  const sel = "from_location_id,to_location_id:to_destination_id,relation,weight";
  // Fallback: assume a materialized view exists; if not, this will no-op gracefully
  const query = `destination_links?from_location_id=eq.${encodeURIComponent(destId)}&select=from_location_id,to_location_id,relation,weight`;
  const rows = await supaFetch(query, { revalidate: 300, tags: ["destination_links", `destination_links:${destId}`] }).catch(() => []);
  return rows;
}

export async function fetchDestinationsByIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const sel = "id,slug,name";
  const list = ids.map((x) => encodeURIComponent(x)).join(",");
  const query = `destinations?id=in.(${list})&select=${sel}`;
  return supaFetch(query, { revalidate: 300, tags: ["destinations"] });
}
