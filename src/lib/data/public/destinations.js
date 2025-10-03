import { getPublicDB } from "@/lib/supabase/public";

export async function listPublishedDestinations() {
  const db = getPublicDB();
  const { data, error } = await db
    .from("destinations")
    .select("id, slug, name, summary, images, credit, status")
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
      "id, name, slug, status, prefecture_id, division_id, images, body_richtext, credit, lat, lng, published_at, gyg_location_id"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

