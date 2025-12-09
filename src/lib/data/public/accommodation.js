import { getPublicDB } from "@/lib/supabase/public";

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
