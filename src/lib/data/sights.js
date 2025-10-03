import { getDB } from "@/lib/supabase/server";

export async function getPublishedSights() {
  const db = await getDB();
  const { data, error } = await db
    .from("sights")
    .select(
      "id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id, destinations ( slug, name )"
    )
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getSightsForDestination(destId, divisionSlug = null) {
  const db = await getDB();
  let query = db
    .from("sights")
    .select(
      "id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id"
    )
    .eq("destination_id", destId)
    .eq("status", "published")
    .order("name", { ascending: true });

  if (divisionSlug) {
    const { data: div } = await db
      .from("divisions")
      .select("id")
      .eq("slug", String(divisionSlug).trim())
      .maybeSingle();
    if (!div?.id) return [];
    query = query.eq("division_id", div.id);
  }

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

export async function getSightsByDestinationIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const db = await getDB();
  const { data, error } = await db
    .from("sights")
    .select(
      "id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id, destinations ( slug, name )"
    )
    .in("destination_id", ids)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getSightBySlugs(destinationSlug, sightSlug) {
  const db = await getDB();
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name")
    .eq("slug", String(destinationSlug || "").trim())
    .maybeSingle();
  if (!dst?.id) return null;
  const { data, error } = await db
    .from("sights")
    .select(
      "id, slug, name, summary, description, body_richtext, images, destination_id, lat, lng, status, duration_minutes, provider, deeplink, gyg_id, price_amount, price_currency, tags, opening_times_url"
    )
    .eq("destination_id", dst.id)
    .eq("slug", sightSlug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return { sight: data, destination: dst };
}

export async function getSightOpeningHours(id) {
  const db = await getDB();
  const { data, error } = await db
    .from("sight_opening_hours")
    .select(
      "start_month, start_day, end_month, end_day, open_time, close_time, last_entry_mins"
    )
    .eq("sight_id", id)
    .order("start_month", { ascending: true })
    .order("start_day", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getSightOpeningExceptions(id) {
  const db = await getDB();
  const { data, error } = await db
    .from("sight_opening_exceptions")
    .select("type, start_date, end_date, weekday, note")
    .eq("sight_id", id)
    .order("start_date", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getSightAdmissionPrices(sightId) {
  const db = await getDB();
  const { data, error } = await db
    .from("sight_admission_prices")
    .select(
      "id, sight_id, category, price_minor, currency, start_month, end_month, notes, sort_order, is_active"
    )
    .eq("sight_id", sightId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return data || [];
}
