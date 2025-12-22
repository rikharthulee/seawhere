import { getPublicDB } from "@/lib/supabase/public";

export async function listPublishedDestinations() {
  const db = getPublicDB();
  const { data, error } = await db
    .from("destinations")
    .select(
      "id, slug, name, summary, images, credit, status, country_id, countries ( slug, name )"
    )
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getDestinationBySlugPublic(slug) {
  const db = getPublicDB();
  const { data, error } = await db
    .from("destinations")
    .select(
      "id, name, slug, status, country_id, images, body_richtext, credit, lat, lng, published_at, gyg_location_id, countries ( id, slug, name, iso_code )"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getDestinationBySlugsPublic(countrySlug, destinationSlug) {
  const db = getPublicDB();
  const normalizedCountry = String(countrySlug || "").trim().toLowerCase();
  const normalizedDestination = String(destinationSlug || "").trim().toLowerCase();
  if (!normalizedCountry || !normalizedDestination) return null;

  const { data, error } = await db
    .from("destinations")
    .select(
      "id, name, slug, status, country_id, images, body_richtext, credit, lat, lng, published_at, gyg_location_id, countries ( id, slug, name, iso_code )"
    )
    .eq("slug", normalizedDestination)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (
    !data ||
    String(data?.countries?.slug || "").toLowerCase() !== normalizedCountry
  ) {
    return null;
  }
  return data;
}
