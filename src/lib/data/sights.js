import { supabaseAdmin } from "@/lib/supabaseServer";

export async function getPublishedSights() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("sights")
    .select("id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id, destinations ( slug, name )")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getSightsForDestination(destId) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("sights")
    .select("id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id")
    .eq("destination_id", destId)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getSightsByDestinationIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("sights")
    .select("id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id, destinations ( slug, name )")
    .in("destination_id", ids)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getSightBySlugs(destinationSlug, sightSlug) {
  const db = supabaseAdmin();
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name")
    .eq("slug", String(destinationSlug || "").trim())
    .maybeSingle();
  if (!dst?.id) return null;
  const { data, error } = await db
    .from("sights")
    .select("id, slug, name, summary, description, body_richtext, images, destination_id, lat, lng, status, duration_minutes, provider, deeplink, gyg_id, price_amount, price_currency")
    .eq("destination_id", dst.id)
    .eq("slug", sightSlug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return { sight: data, destination: dst };
}

export async function getSightOpeningHours(id) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("sight_opening_hours")
    .select("weekday, idx, open_time, close_time, is_closed, valid_from, valid_to")
    .eq("sight_id", id)
    .order("weekday", { ascending: true })
    .order("idx", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getSightOpeningExceptions(id) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("sight_opening_exceptions")
    .select("date, is_closed, open_time, close_time, note")
    .eq("sight_id", id)
    .order("date", { ascending: true });
  if (error) return [];
  return data || [];
}
