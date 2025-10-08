import { getPublicDB } from "@/lib/supabase/public";
import {
  listDestinationsByPrefectureId,
  listDestinationsByDivisionId,
} from "@/lib/data/public/geo";
import { TOUR_PUBLIC_COLUMNS } from "@/lib/data/public/selects";

function isUUID(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(v || "").trim()
  );
}

export async function listPublishedTours() {
  const db = getPublicDB();
  const { data, error } = await db
    .from("tours")
    .select("id, slug, name, summary, images, destination_id, status, destinations ( slug )")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listToursByDestinationSlug(destinationSlug, divisionSlug = null) {
  const db = getPublicDB();
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name")
    .eq("slug", String(destinationSlug || "").trim())
    .maybeSingle();
  if (!dst?.id) return { destination: null, tours: [] };
  let query = db
    .from("tours")
    .select("id, slug, name, summary, images, destination_id, status, destinations ( slug )")
    .eq("destination_id", dst.id)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (divisionSlug) {
    const { data: div } = await db
      .from("divisions")
      .select("id")
      .eq("slug", String(divisionSlug).trim())
      .maybeSingle();
    if (!div?.id) return { destination: dst, tours: [] };
    query = query.eq("division_id", div.id);
  }
  const { data, error } = await query;
  if (error) throw error;
  return { destination: dst, tours: data ?? [] };
}

export async function getTourBySlugPublic(slug) {
  const db = getPublicDB();
  const normalized = String(slug || "").trim();
  if (!normalized) {
    console.warn("[public:tours] invalid slug", { slug });
    return { tour: null, destination: null };
  }

  const { data, error, status } = await db
    .from("tours")
    .select(`${TOUR_PUBLIC_COLUMNS}, destinations ( id, slug, name )`)
    .eq("slug", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[public:tours] select failed", {
      table: "tours",
      status,
      msg: error.message,
    });
    return { tour: null, destination: null };
  }

  if (!data) {
    console.warn("[public:tours] entity not visible", {
      table: "tours",
      slug: normalized,
    });
    return { tour: null, destination: null };
  }

  const { destinations: destination, ...tour } = data;
  return { tour, destination: destination || null };
}

export async function getTourByIdPublic(id) {
  const db = getPublicDB();
  const normalized = String(id || "").trim();
  if (!isUUID(normalized)) {
    console.warn("[public:tours] invalid id", { id });
    return { tour: null, destination: null };
  }

  const { data, error, status } = await db
    .from("tours")
    .select(`${TOUR_PUBLIC_COLUMNS}, destinations ( id, slug, name )`)
    .eq("id", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[public:tours] select failed", {
      table: "tours",
      status,
      msg: error.message,
    });
    return { tour: null, destination: null };
  }

  if (!data) {
    console.warn("[public:tours] entity not visible", {
      table: "tours",
      id: normalized,
    });
    return { tour: null, destination: null };
  }

  const { destinations: destination, ...tour } = data;
  return { tour, destination: destination || null };
}

export async function listToursByRegionSlug(regionSlug) {
  const db = getPublicDB();
  const { data: region } = await db
    .from("regions")
    .select("id")
    .eq("slug", String(regionSlug || "").trim())
    .maybeSingle();
  if (!region?.id) return [];
  const { data: prefs } = await db
    .from("prefectures")
    .select("id")
    .eq("region_id", region.id);
  const prefIds = (prefs || []).map((p) => p.id).filter(Boolean);
  if (prefIds.length === 0) return [];
  const { data: dests } = await db
    .from("destinations")
    .select("id")
    .in("prefecture_id", prefIds);
  const destIds = (dests || []).map((d) => d.id).filter(Boolean);
  if (destIds.length === 0) return [];
  const { data, error } = await db
    .from("tours")
    .select("id, slug, name, summary, images, destination_id, status, destinations ( slug )")
    .in("destination_id", destIds)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listToursByPrefectureSlug(prefSlug) {
  const db = getPublicDB();
  const { data: pref } = await db
    .from("prefectures")
    .select("id")
    .eq("slug", String(prefSlug || "").trim())
    .maybeSingle();
  if (!pref?.id) return [];
  const dests = await listDestinationsByPrefectureId(pref.id);
  const destIds = dests.map((d) => d.id).filter(Boolean);
  if (destIds.length === 0) return [];
  const { data, error } = await db
    .from("tours")
    .select("id, slug, name, summary, images, destination_id, status, destinations ( slug )")
    .in("destination_id", destIds)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listToursByDivisionSlug(divSlug) {
  const db = getPublicDB();
  const { data: div } = await db
    .from("divisions")
    .select("id")
    .eq("slug", String(divSlug || "").trim())
    .maybeSingle();
  if (!div?.id) return [];
  const dests = await listDestinationsByDivisionId(div.id);
  const destIds = dests.map((d) => d.id).filter(Boolean);
  if (destIds.length === 0) return [];
  const { data, error } = await db
    .from("tours")
    .select("id, slug, name, summary, images, destination_id, status, destinations ( slug )")
    .in("destination_id", destIds)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
