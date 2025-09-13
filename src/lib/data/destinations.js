import { supabaseAdmin } from "@/lib/supabase/serverAdmin";

export async function getPublishedDestinations() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("destinations")
    .select("id, slug, name, summary, hero_image, thumbnail_image, credit")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function getDestinationBySlug(slug) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("destinations")
    .select("id, name, slug, status, prefecture_id, division_id, hero_image, thumbnail_image, images, body_richtext, credit, lat, lng, published_at, created_at, gyg_location_id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function getDestinationBySlugLoose(slug) {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("destinations")
    .select("id, slug, name, status")
    .eq("slug", String(slug || "").trim())
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function getDestinationById(id) {
  if (!id) return null;
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("destinations")
    .select("id, name, slug, status")
    .eq("id", id)
    .maybeSingle();
  if (error) return null;
  return data;
}
