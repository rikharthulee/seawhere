import { createServerClient } from "@/lib/supabase/server";

export async function getPublishedAccommodation() {
  const db = createServerClient();
  const { data, error } = await db
    .from("accommodation")
    .select("id, slug, name, summary, images, credit")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getAccommodationBySlug(slug) {
  const db = createServiceClient();
  const { data, error } = await db
    .from("accommodation")
    .select(
      "slug,name,summary,description,images,status,credit,price_band,rating,website_url,affiliate_url,lat,lng,address,destination_id,prefecture_id,division_id"
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return data;
}
