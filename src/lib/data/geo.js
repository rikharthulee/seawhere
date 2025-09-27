import { createServiceClient } from "@/lib/supabase/service";
import env from "@/lib/env";
import {
  normalizePrefectureShape,
  normalizeDivisionShape,
  sortGeoRows,
} from "@/lib/geo-normalize";

const useGeoViews = env.USE_GEO_VIEWS();

const normalizePrefecture = normalizePrefectureShape;
const normalizeDivision = normalizeDivisionShape;

export async function getRegions() {
  const db = createServiceClient();
  const { data } = await db
    .from("regions")
    .select("id, slug, name, order_index")
    .order("order_index", { ascending: true });
  return data || [];
}

export async function getPrefectures() {
  const db = createServiceClient();
  if (useGeoViews) {
    const { data, error } = await db.from("geo_prefectures_v").select("*");
    if (!error && Array.isArray(data)) {
      return sortGeoRows(data.map(normalizePrefecture).filter(Boolean));
    }
  }
  const { data } = await db
    .from("prefectures")
    .select("id, slug, name, region_id, order_index")
    .order("order_index", { ascending: true });
  return sortGeoRows((data || []).map(normalizePrefecture).filter(Boolean));
}

export async function getRegionBySlug(slug) {
  const db = createServiceClient();
  const { data } = await db
    .from("regions")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
  return data || null;
}

export async function getPrefecturesByRegion(regionId) {
  const db = createServiceClient();
  if (useGeoViews) {
    let query = db.from("geo_prefectures_v").select("*");
    if (regionId) {
      query = query.eq("region_id", regionId);
    }
    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      return sortGeoRows(data.map(normalizePrefecture).filter(Boolean));
    }
  }
  const { data } = await db
    .from("prefectures")
    .select("id, name, slug, region_id, order_index")
    .eq("region_id", regionId)
    .order("order_index", { ascending: true });
  return sortGeoRows((data || []).map(normalizePrefecture).filter(Boolean));
}

export async function getPrefectureBySlug(slug, regionId) {
  const db = createServiceClient();
  if (useGeoViews) {
    let query = db.from("geo_prefectures_v").select("*").eq("prefecture_slug", slug);
    if (regionId) query = query.eq("region_id", regionId);
    const { data, error } = await query.maybeSingle();
    if (!error && data) return normalizePrefecture(data);
  }
  const { data, error } = await db
    .from("prefectures")
    .select("id, slug, name, region_id")
    .eq("slug", slug)
    .eq("region_id", regionId)
    .maybeSingle();
  if (error || !data) return null;
  return normalizePrefecture(data);
}

export async function getDivisionsByPrefecture(prefId) {
  const db = createServiceClient();
  if (useGeoViews) {
    let targetPrefSlug = null;
    if (prefId) {
      const { data: prefRow } = await db
        .from("prefectures")
        .select("slug")
        .eq("id", prefId)
        .maybeSingle();
      targetPrefSlug = prefRow?.slug || null;
    }
    let query = db.from("geo_divisions_v").select("*");
    if (targetPrefSlug) query = query.eq("prefecture_slug", targetPrefSlug);
    else if (prefId) query = query.eq("prefecture_id", prefId);
    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      return sortGeoRows(data.map(normalizeDivision).filter(Boolean));
    }
  }
  const { data } = await db
    .from("divisions")
    .select("id, name, slug, prefecture_id, order_index")
    .eq("prefecture_id", prefId)
    .order("order_index", { ascending: true });
  return sortGeoRows((data || []).map(normalizeDivision).filter(Boolean));
}

export async function getPrefectureById(id) {
  const db = createServiceClient();
  if (useGeoViews) {
    const { data, error } = await db
      .from("geo_prefectures_v")
      .select("*")
      .eq("prefecture_id", id)
      .maybeSingle();
    if (!error && data) return normalizePrefecture(data);
  }
  const { data, error } = await db
    .from("prefectures")
    .select("id, name, slug, region_id")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return normalizePrefecture(data);
}

export async function getDivisionById(id) {
  const db = createServiceClient();
  if (useGeoViews) {
    const { data, error } = await db
      .from("geo_divisions_v")
      .select("*")
      .eq("division_id", id)
      .maybeSingle();
    if (!error && data) return normalizeDivision(data);
  }
  const { data, error } = await db
    .from("divisions")
    .select("id, name, slug, prefecture_id")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return normalizeDivision(data);
}

export async function getDestinationsByPrefectureIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const db = createServiceClient();
  const { data } = await db
    .from("destinations")
    .select("id, slug, name, summary, images, prefecture_id, division_id")
    .in("prefecture_id", ids)
    .eq("status", "published")
    .order("name", { ascending: true });
  return data || [];
}

export async function getDestinationsByPrefecture(prefId) {
  const db = createServiceClient();
  const { data } = await db
    .from("destinations")
    .select("id, slug, name, summary, images, prefecture_id, division_id")
    .eq("prefecture_id", prefId)
    .eq("status", "published")
    .order("name", { ascending: true });
  return data || [];
}

export async function getDivisionBySlugLoose(slug) {
  const db = createServiceClient();
  if (useGeoViews) {
    const { data, error } = await db
      .from("geo_divisions_v")
      .select("*")
      .eq("division_slug", slug)
      .maybeSingle();
    if (!error && data) return normalizeDivision(data);
  }
  const { data } = await db
    .from("divisions")
    .select("id, name, slug, prefecture_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  return normalizeDivision(data);
}

export async function getDestinationsByDivision(divId) {
  const db = createServiceClient();
  const { data } = await db
    .from("destinations")
    .select("id, slug, name, summary, images, prefecture_id, division_id")
    .eq("division_id", divId)
    .eq("status", "published")
    .order("name", { ascending: true });
  return data || [];
}

export { normalizePrefecture, normalizeDivision };
