// lib/queries.js
import { createServerClient } from "@/lib/supabase/server";

export async function getDestinations() {
  const supabase = createServerClient();
  return supabase
    .from("destinations")
    .select("id, slug, name, summary, images")
    .eq("status", "published")
    .order("published_at", { ascending: false });
}

export async function getDestination(slug) {
  const supabase = createServerClient();
  return supabase
    .from("destinations")
    .select(
      "id, slug, name, summary, body_richtext, images, credit, prefecture_id, division_id, lat, lng, gyg_location_id, status, published_at, created_at"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
}

export async function getDestinationWithAreas(slug) {
  const supabase = createServerClient();

  const { data: destination, error: dErr } = await supabase
    .from("destinations")
    .select(
      "id, slug, name, summary, body_richtext, images, credit, prefecture_id, division_id, lat, lng, gyg_location_id, status, published_at, created_at"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (dErr || !destination) return { destination: null, areas: [] };

  const { data: areas, error: aErr } = await supabase
    .from("destinations")
    .select("id, slug, name, summary, images")
    .eq("destination_id", destination.id)
    .eq("status", "published")
    .order("position", { ascending: true });

  return { destination, areas: areas || [] };
}
