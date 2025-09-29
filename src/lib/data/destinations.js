import { getDB } from "@/lib/supabase/server";

export async function getPublishedDestinations() {
  const db = await getDB(); // ✅ Added await
  const { data, error } = await db
    .from("destinations")
    .select("id, slug, name, summary, images, credit")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) {
    console.error("getPublishedDestinations error", error);
    return [];
  }
  return Array.isArray(data) ? JSON.parse(JSON.stringify(data)) : [];
}

export async function getDestinationBySlug(slug) {
  const db = await getDB(); // ✅ Added await
  const { data, error } = await db
    .from("destinations")
    .select(
      "id, name, slug, status, prefecture_id, division_id, images, body_richtext, credit, lat, lng, published_at, created_at, gyg_location_id"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) {
    console.error("getDestinationBySlug error", { slug, error });
    return null;
  }
  return data ? JSON.parse(JSON.stringify(data)) : null;
}

export async function getDestinationBySlugLoose(slug) {
  const db = await getDB(); // ✅ Added await
  const { data, error } = await db
    .from("destinations")
    .select("id, slug, name, status")
    .eq("slug", String(slug || "").trim())
    .maybeSingle();
  if (error) {
    console.error("getDestinationBySlugLoose error", { slug, error });
    return null;
  }
  return data ? JSON.parse(JSON.stringify(data)) : null;
}

export async function getDestinationById(id) {
  if (!id) return null;
  const db = await getDB(); // ✅ Added await
  const { data, error } = await db
    .from("destinations")
    .select("id, name, slug, status")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getDestinationById error", { id, error });
    return null;
  }
  return data ? JSON.parse(JSON.stringify(data)) : null;
}
