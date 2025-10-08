import { getPublicDB } from "@/lib/supabase/public";
import { EXPERIENCE_PUBLIC_COLUMNS } from "@/lib/data/public/selects";

function isUUID(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(v || "").trim()
  );
}

export async function listPublishedExperiences() {
  const db = getPublicDB();
  const { data, error } = await db
    .from("experiences")
    .select("id, slug, name, summary, images, destination_id, status")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listExperiencesByDestinationSlug(destSlug, divisionSlug = null) {
  const db = getPublicDB();
  const { data: dst, error: e1 } = await db
    .from("destinations")
    .select("id, slug, name")
    .eq("slug", String(destSlug || "").trim())
    .maybeSingle();
  if (e1 || !dst?.id) return { destination: null, experiences: [] };
  let query = db
    .from("experiences")
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
    if (!div?.id) return { destination: dst, experiences: [] };
    query = query.eq("division_id", div.id);
  }
  const { data, error } = await query;
  if (error) throw error;
  return { destination: dst, experiences: data ?? [] };
}

export async function getExperienceBySlugPublic(slug) {
  const db = getPublicDB();
  const normalized = String(slug || "").trim();
  if (!normalized) {
    console.warn("[public:experiences] invalid slug", { slug });
    return { experience: null, destination: null };
  }

  const { data, error, status } = await db
    .from("experiences")
    .select(`${EXPERIENCE_PUBLIC_COLUMNS}, destinations ( id, slug, name )`)
    .eq("slug", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[public:experiences] select failed", {
      table: "experiences",
      status,
      msg: error.message,
    });
    return { experience: null, destination: null };
  }

  if (!data) {
    console.warn("[public:experiences] entity not visible", {
      table: "experiences",
      slug: normalized,
    });
    return { experience: null, destination: null };
  }

  const { destinations: destination, ...experience } = data;
  return { experience, destination: destination || null };
}

export async function getExperienceByIdPublic(id) {
  const db = getPublicDB();
  const normalized = String(id || "").trim();
  if (!isUUID(normalized)) {
    console.warn("[public:experiences] invalid id", { id });
    return { experience: null, destination: null };
  }

  const { data, error, status } = await db
    .from("experiences")
    .select(`${EXPERIENCE_PUBLIC_COLUMNS}, destinations ( id, slug, name )`)
    .eq("id", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[public:experiences] select failed", {
      table: "experiences",
      status,
      msg: error.message,
    });
    return { experience: null, destination: null };
  }

  if (!data) {
    console.warn("[public:experiences] entity not visible", {
      table: "experiences",
      id: normalized,
    });
    return { experience: null, destination: null };
  }

  const { destinations: destination, ...experience } = data;
  return { experience, destination: destination || null };
}

export async function listExperiencesByRegionSlug(regionSlug) {
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
    .from("experiences")
    .select("id, slug, name, summary, images, destination_id, status, destinations ( slug )")
    .in("destination_id", destIds)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listExperiencesByPrefectureSlug(prefSlug) {
  const db = getPublicDB();
  const { data: pref } = await db
    .from("prefectures")
    .select("id")
    .eq("slug", String(prefSlug || "").trim())
    .maybeSingle();
  if (!pref?.id) return [];
  const { data: dests } = await db
    .from("destinations")
    .select("id")
    .eq("prefecture_id", pref.id);
  const destIds = (dests || []).map((d) => d.id).filter(Boolean);
  if (destIds.length === 0) return [];
  const { data, error } = await db
    .from("experiences")
    .select("id, slug, name, summary, images, destination_id, status, destinations ( slug )")
    .in("destination_id", destIds)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listExperiencesByDivisionSlug(divSlug) {
  const db = getPublicDB();
  const { data: div } = await db
    .from("divisions")
    .select("id")
    .eq("slug", String(divSlug || "").trim())
    .maybeSingle();
  if (!div?.id) return [];
  const { data: dests } = await db
    .from("destinations")
    .select("id")
    .eq("division_id", div.id);
  const destIds = (dests || []).map((d) => d.id).filter(Boolean);
  if (destIds.length === 0) return [];
  const { data, error } = await db
    .from("experiences")
    .select("id, slug, name, summary, images, destination_id, status, destinations ( slug )")
    .in("destination_id", destIds)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
