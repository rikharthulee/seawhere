import { supabaseAdmin } from "@/lib/supabaseServer";

export async function getRegions() {
  const db = supabaseAdmin();
  const { data } = await db
    .from("regions")
    .select("id, slug, name, order_index")
    .order("order_index", { ascending: true });
  return data || [];
}

export async function getPrefectures() {
  const db = supabaseAdmin();
  const { data } = await db
    .from("prefectures")
    .select("id, slug, name, region_id, order_index")
    .order("order_index", { ascending: true });
  return data || [];
}

export async function getRegionBySlug(slug) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("regions")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
  return data || null;
}

export async function getPrefecturesByRegion(regionId) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("prefectures")
    .select("id, name, slug, region_id, order_index")
    .eq("region_id", regionId)
    .order("order_index", { ascending: true });
  return data || [];
}

export async function getPrefectureBySlug(slug, regionId) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("prefectures")
    .select("id, slug, name, region_id")
    .eq("slug", slug)
    .eq("region_id", regionId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function getDivisionsByPrefecture(prefId) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("divisions")
    .select("id, name, slug, prefecture_id, order_index")
    .eq("prefecture_id", prefId)
    .order("order_index", { ascending: true });
  return data || [];
}

export async function getPrefectureById(id) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("prefectures")
    .select("id, name, slug, region_id")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function getDivisionById(id) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("divisions")
    .select("id, name, slug, prefecture_id")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function getDestinationsByPrefectureIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const db = supabaseAdmin();
  const { data } = await db
    .from("destinations")
    .select("id, name, slug, status, prefecture_id, division_id, thumbnail_image, hero_image")
    .in("prefecture_id", ids)
    .eq("status", "published")
    .order("name", { ascending: true });
  return data || [];
}

export async function getDestinationsByPrefecture(prefId) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("destinations")
    .select("id, name, slug, status, prefecture_id, division_id, thumbnail_image, hero_image")
    .eq("prefecture_id", prefId)
    .eq("status", "published")
    .order("name", { ascending: true });
  return data || [];
}

export async function getDivisionBySlugLoose(slug) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("divisions")
    .select("id, name, slug, prefecture_id")
    .eq("slug", slug)
    .maybeSingle();
  return data || null;
}

export async function getDestinationsByDivision(divId) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("destinations")
    .select("id, name, slug, status, prefecture_id, division_id, thumbnail_image, hero_image")
    .eq("division_id", divId)
    .eq("status", "published")
    .order("name", { ascending: true });
  return data || [];
}
