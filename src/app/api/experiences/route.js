import { getDB } from "@/lib/supabase/server";

export async function GET() {
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("experiences")
      .select("id, slug, name, summary, images, destination_id, status")
      .eq("status", "published")
      .order("name", { ascending: true });
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

