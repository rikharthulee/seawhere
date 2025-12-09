import { getDB } from "@/lib/supabase/server";

export async function getPublishedExperiences() {
  const db = await getDB();
  const { data, error } = await db
    .from("experiences")
    .select(
      "id, slug, name, summary, images, destination_id, destinations ( slug, name )"
    )
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getExperiencesForDestination(destId) {
  const db = await getDB();
  const { data, error } = await db
    .from("experiences")
    .select("id, slug, name, summary, images, destination_id")
    .eq("destination_id", destId)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getExperiencesByDestinationIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const db = await getDB();
  const { data, error } = await db
    .from("experiences")
    .select(
      "id, slug, name, summary, images, destination_id, destinations ( slug, name )"
    )
    .in("destination_id", ids)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getExperienceBySlugs(destinationSlug, experienceSlug) {
  const db = await getDB();
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name")
    .eq("slug", String(destinationSlug || "").trim())
    .maybeSingle();
  if (!dst?.id) return null;
  const { data, error } = await db
    .from("experiences")
    .select(
      "id, slug, name, summary, description, body_richtext, images, destination_id, lat, lng, status, price, price_amount, price_currency, duration_minutes, provider, deeplink, gyg_id, tags"
    )
    .eq("destination_id", dst.id)
    .eq("slug", experienceSlug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return { experience: data, destination: dst };
}

export async function getExperienceAvailabilityRules(id) {
  const db = await getDB();
  const { data, error } = await db
    .from("experience_availability_rules")
    .select("idx, days_of_week, start_times, valid_from, valid_to, timezone")
    .eq("experience_id", id)
    .order("idx", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getExperienceExceptions(id) {
  const db = await getDB();
  const { data, error } = await db
    .from("experience_exceptions")
    .select("date, action, start_time, note")
    .eq("experience_id", id)
    .order("date", { ascending: true });
  if (error) return [];
  return data || [];
}
