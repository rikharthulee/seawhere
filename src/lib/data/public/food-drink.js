import { getPublicDB } from "@/lib/supabase/public";
import { getDestinationBySlugsPublic } from "@/lib/data/public/destinations";

export async function listPublishedFoodDrink() {
  const db = getPublicDB();
  const { data, error } = await db
    .from("food_drink")
    .select("id, slug, name, images, status, type, price_band, rating")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listFoodDrinkByDestinationId(destinationId) {
  if (!destinationId) return [];
  const db = getPublicDB();
  const { data, error } = await db
    .from("food_drink")
    .select("id, slug, name, description, images, status, type, price_band, rating")
    .eq("destination_id", destinationId)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getFoodDrinkBySlugPublic(slug) {
  const db = getPublicDB();
  const normalized = String(slug || "").trim();
  if (!normalized) return null;
  const { data, error } = await db
    .from("food_drink")
    .select(
      "slug, name, description, images, status, type, price_band, rating, booking_url, address, lat, lng, destination_id, country_id"
    )
    .eq("slug", normalized)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function getFoodDrinkByDestinationSlugsPublic({
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
    .from("food_drink")
    .select(
      "slug, name, description, images, status, type, price_band, rating, booking_url, address, lat, lng, destination_id, country_id"
    )
    .eq("slug", String(placeSlug || "").trim())
    .eq("destination_id", destination.id)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return { place: data || null, destination };
}
