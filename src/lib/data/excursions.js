import { createServiceClient } from "@/lib/supabase/service";

// Top-level excursions list
export async function getPublishedExcursions() {
  const db = createServiceClient();
  const { data, error } = await db
    .from("excursions")
    .select(
      "id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id, destinations ( slug, name )"
    )
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

// Excursions scoped to a destination
export async function getExcursionsForDestination(destId) {
  const db = createServiceClient();
  const { data, error } = await db
    .from("excursions")
    .select(
      "id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id"
    )
    .eq("destination_id", destId)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

// Excursions for a set of destination ids (region/prefecture/division pages)
export async function getExcursionsByDestinationIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const db = createServiceClient();
  const { data, error } = await db
    .from("excursions")
    .select(
      "id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id, destinations ( slug, name )"
    )
    .in("destination_id", ids)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

// Single excursion by destination slug + excursion slug
export async function getExcursionBySlugs(destinationSlug, excursionSlug) {
  const db = createServiceClient();
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name")
    .eq("slug", String(destinationSlug || "").trim())
    .maybeSingle();
  if (!dst?.id) return null;
  const { data, error } = await db
    .from("excursions")
    .select(
      "id, slug, name, summary, description, body_richtext, images, destination_id, lat, lng, status, duration_minutes, provider, deeplink, gyg_id, price_amount, price_currency"
    )
    .eq("destination_id", dst.id)
    .eq("slug", excursionSlug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return { excursion: data, destination: dst };
}

// Optional: opening hours/exception helpers if tracked for excursions
export async function getExcursionOpeningHours(id) {
  const db = createServiceClient();
  const { data, error } = await db
    .from("excursion_opening_hours")
    .select(
      "weekday, idx, open_time, close_time, is_closed, valid_from, valid_to"
    )
    .eq("excursion_id", id)
    .order("weekday", { ascending: true })
    .order("idx", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getExcursionOpeningExceptions(id) {
  const db = createServiceClient();
  const { data, error } = await db
    .from("excursion_opening_exceptions")
    .select("date, is_closed, open_time, close_time, note")
    .eq("excursion_id", id)
    .order("date", { ascending: true });
  if (error) return [];
  return data || [];
}
