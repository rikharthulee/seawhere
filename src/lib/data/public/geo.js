import { getPublicDB } from "@/lib/supabase/public";

export async function listRegionsPublic() {
  const db = getPublicDB();
  const { data, error } = await db
    .from("regions")
    .select("id, name, slug, order_index")
    .order("order_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listPrefecturesPublic() {
  const db = getPublicDB();
  const { data, error } = await db
    .from("prefectures")
    .select("id, name, slug, region_id, order_index")
    .order("order_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getRegionBySlugPublic(slug) {
  const db = getPublicDB();
  const { data, error } = await db
    .from("regions")
    .select("id, name, slug")
    .eq("slug", String(slug || "").trim())
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getPrefectureBySlugPublic(slug) {
  const db = getPublicDB();
  const { data, error } = await db
    .from("prefectures")
    .select("id, name, slug, region_id")
    .eq("slug", String(slug || "").trim())
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getDivisionBySlugPublic(slug) {
  const db = getPublicDB();
  const { data, error } = await db
    .from("divisions")
    .select("id, name, slug, prefecture_id")
    .eq("slug", String(slug || "").trim())
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function listDestinationsByPrefectureId(prefectureId) {
  if (!prefectureId) return [];
  const db = getPublicDB();
  const { data, error } = await db
    .from("destinations")
    .select("id, name, slug, prefecture_id, division_id, status")
    .eq("prefecture_id", prefectureId)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listDestinationsByDivisionId(divisionId) {
  if (!divisionId) return [];
  const db = getPublicDB();
  const { data, error } = await db
    .from("destinations")
    .select("id, name, slug, prefecture_id, division_id, status")
    .eq("division_id", divisionId)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listDivisionsByPrefectureId(prefectureId) {
  if (!prefectureId) return [];
  const db = getPublicDB();
  const { data, error } = await db
    .from("divisions")
    .select("id, name, slug, prefecture_id, order_index")
    .eq("prefecture_id", prefectureId)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
