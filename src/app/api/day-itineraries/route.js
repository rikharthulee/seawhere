import { getDB } from "@/lib/supabase/server";

export async function GET() {
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("day_itineraries")
      .select(
        "id, slug, name, description, summary, transport, maps_url, cover_image, updated_at, status"
      )
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return new Response(JSON.stringify(data ?? []), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
