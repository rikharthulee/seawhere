import { supabaseAdmin } from "@/lib/supabase/serverAdmin";

export async function getPublishedAccommodation() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("accommodation")
    .select("id, slug, name, summary, hero_image, thumbnail_image, credit")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getAccommodationBySlug(slug) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("accommodation")
    .select("slug,name,summary,description,hero_image,thumbnail_image,images,status,credit,price_band,rating,website_url,affiliate_url,lat,lng,address,destination_id,prefecture_id,division_id")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return null;
  return data;
}

