import { getPublicDB } from "@/lib/supabase/public";
import { getDestinationBySlugsPublic } from "@/lib/data/public/destinations";

export async function listPublishedAccommodation() {
  const db = getPublicDB();
  const { data, error } = await db
    .from("accommodation")
    .select("id, slug, name, summary, images, credit, status")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listAccommodationByDestinationId(destinationId) {
  if (!destinationId) return [];
  const db = getPublicDB();
  const { data, error } = await db
    .from("accommodation")
    .select("id, slug, name, summary, images, credit, status, price_band, rating")
    .eq("destination_id", destinationId)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAccommodationBySlugPublic(slug) {
  const db = getPublicDB();
  const { data, error } = await db
    .from("accommodation")
    .select(
      "slug, name, summary, description, images, status, credit, price_band, rating, website_url, affiliate_url, lat, lng, address, destination_id, country_id"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getAccommodationByDestinationSlugsPublic({
  countrySlug,
  destinationSlug,
  placeSlug,
}) {
  const destination = await getDestinationBySlugsPublic(
    countrySlug,
    destinationSlug
  );
  if (!destination?.id || !placeSlug) return { place: null, destination: null };

  const db = getPublicDB();
  const { data, error } = await db
    .from("accommodation")
    .select(
      "slug, name, summary, description, images, status, credit, price_band, rating, website_url, affiliate_url, lat, lng, address, destination_id, country_id"
    )
    .eq("slug", String(placeSlug || "").trim())
    .eq("destination_id", destination.id)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return { place: data || null, destination };
}
