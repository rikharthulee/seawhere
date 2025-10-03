import { getPublicDB } from "@/lib/supabase/public";
import {
  listDestinationsByPrefectureId,
  listDestinationsByDivisionId,
} from "@/lib/data/public/geo";

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

export async function getTourBySlugsPublic(destinationSlug, tourSlug) {
  const db = getPublicDB();
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name")
    .eq("slug", String(destinationSlug || "").trim())
    .maybeSingle();
  if (!dst?.id) return null;
  const { data, error } = await db
    .from("tours")
    .select(
      "id, slug, name, summary, description, images, destination_id, status, provider, price_amount, price_currency, duration_minutes"
    )
    .eq("destination_id", dst.id)
    .eq("slug", tourSlug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return { tour: data, destination: dst };
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

