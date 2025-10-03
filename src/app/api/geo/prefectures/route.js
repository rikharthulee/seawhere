import { getDB } from "@/lib/supabase/server";

export async function GET() {
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("prefectures")
      .select("id, name, slug, region_id, order_index")
      .order("order_index", { ascending: true });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return new Response(JSON.stringify(data ?? []), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    });
  } catch (e) {
    return Response.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

