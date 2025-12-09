import { getPublicDB } from "@/lib/supabase/public";

export async function listCountriesPublic() {
  const db = getPublicDB();
  const { data, error } = await db
    .from("countries")
    .select("id, name, slug, iso_code, default_currency")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getCountryBySlugPublic(slug) {
  const db = getPublicDB();
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

export async function listDestinationsByCountryId(countryId) {
  if (!countryId) return [];
  const db = getPublicDB();
  const { data, error } = await db
    .from("destinations")
    .select("id, name, slug, status, images, country_id, destination_id")
    .eq("country_id", countryId)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listDestinationsByCountrySlug(countrySlug) {
  const country = await getCountryBySlugPublic(countrySlug);
  if (!country?.id) return { country: null, destinations: [] };
  const destinations = await listDestinationsByCountryId(country.id);
  return { country, destinations };
}
