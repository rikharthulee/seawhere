import { supabaseAdmin } from "@/lib/supabaseServer";

export async function getPublishedTours() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("tours")
    .select("id, slug, name, summary, images, destination_id, provider, deeplink, gyg_id, duration_minutes, price_amount, price_currency, tags, destinations ( slug, name )")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getToursForDestination(destId, divisionSlug = null) {
  const db = supabaseAdmin();
  let query = db
    .from("tours")
    .select("id, slug, name, summary, images, destination_id, provider, deeplink, gyg_id, duration_minutes, price_amount, price_currency, tags")
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

export async function getToursByDestinationIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("tours")
    .select("id, slug, name, summary, images, destination_id, provider, deeplink, gyg_id, duration_minutes, price_amount, price_currency, tags, destinations ( slug, name )")
    .in("destination_id", ids)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getTourBySlugs(destinationSlug, tourSlug) {
  const db = supabaseAdmin();
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name")
    .eq("slug", String(destinationSlug || "").trim())
    .maybeSingle();
  if (!dst?.id) return null;
  const { data, error } = await db
    .from("tours")
    .select("id, slug, name, summary, description, body_richtext, images, destination_id, lat, lng, status, duration_minutes, provider, deeplink, gyg_id, price_amount, price_currency, tags")
    .eq("destination_id", dst.id)
    .eq("slug", tourSlug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return { tour: data, destination: dst };
}

export async function getTourAvailabilityRules(id) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("tour_availability_rules")
    .select("idx, days_of_week, start_times, valid_from, valid_to, timezone")
    .eq("tour_id", id)
    .order("idx", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getTourExceptions(id) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("tour_exceptions")
    .select("date, action, start_time, note")
    .eq("tour_id", id)
    .order("date", { ascending: true });
  if (error) return [];
  return data || [];
}
