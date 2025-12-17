import { getDB } from "@/lib/supabase/server";

export async function getDayItinerariesList(limit = 200) {
  const client = await getDB();

  const { data, error } = await client
    .from("day_itineraries")
    .select(
      "id, name, summary, description, maps_url, status, created_at, updated_at, destination_id"
    )
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
}
