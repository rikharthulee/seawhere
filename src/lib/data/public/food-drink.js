import { getPublicDB } from "@/lib/supabase/public";

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

export async function getFoodDrinkBySlugPublic(slug) {
  const db = getPublicDB();
  const normalized = String(slug || "").trim();
  if (!normalized) return null;
  const { data, error } = await db
    .from("food_drink")
    .select(
      "slug, name, description, images, status, type, price_band, rating, booking_url, address, destination_id, country_id"
    )
    .eq("slug", normalized)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data || null;
}
