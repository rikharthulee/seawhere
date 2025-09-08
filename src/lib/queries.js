// lib/queries.js
import { supabaseServer } from "@/lib/supabase/server";

export async function getLocations() {
  const supabase = supabaseServer();
  return supabase
    .from("destinations")
    .select("id, slug, name, summary, hero_image")
    .eq("status", "published")
    .order("published_at", { ascending: false });
}

export async function getLocation(slug) {
  const supabase = supabaseServer();
  return supabase
    .from("destinations")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
}

export async function getLocationWithAreas(slug) {
  const supabase = supabaseServer();

  const { data: destination, error: dErr } = await supabase
    .from("destinations")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (dErr || !destination) return { destination: null, areas: [] };

  const { data: areas, error: aErr } = await supabase
    .from("destinations")
    .select("id, slug, name, summary, thumbnail_image, images")
    .eq("destination_id", destination.id)
    .eq("status", "published")
    .order("position", { ascending: true });

  return { destination, areas: areas || [] };
}
