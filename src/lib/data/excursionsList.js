import { getServiceSupabase } from "@/lib/supabase";

export async function getExcursionsList(limit = 200) {
  const client = getServiceSupabase();

  const { data, error } = await client
    .from("excursions")
    .select(
      "id, name, summary, description, transport, maps_url, status, created_at, updated_at, destination_id"
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
