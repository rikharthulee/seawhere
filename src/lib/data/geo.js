import { getDB } from "@/lib/supabase/server";

export async function getCountries() {
  const db = await getDB();
  const { data, error } = await db
    .from("countries")
    .select("id, name, slug, iso_code, default_currency")
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getCountryBySlug(slug) {
  const db = await getDB();
  const normalized = String(slug || "").trim();
  if (!normalized) return null;
  const { data, error } = await db
    .from("countries")
    .select("id, name, slug, iso_code, default_currency")
    .eq("slug", normalized)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getDestinationsByCountryId(countryId) {
  if (!countryId) return [];
  const db = await getDB();
  const { data, error } = await db
    .from("destinations")
    .select("id, slug, name, summary, images, status, country_id, destination_id")
    .eq("country_id", countryId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getDestinations() {
  const db = await getDB();
  const { data, error } = await db
    .from("destinations")
    .select("id, slug, name, summary, images, status, country_id, destination_id")
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}
