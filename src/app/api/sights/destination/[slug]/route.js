import { getDB } from "@/lib/supabase/server";

export async function GET(_req, ctx) {
  try {
    const { slug } = (await ctx.params) || {};
    const db = await getDB();

    const { data: dst } = await db
      .from("destinations")
      .select("id, slug, name")
      .eq("slug", String(slug || "").trim())
      .maybeSingle();
    if (!dst?.id) return Response.json([], { status: 200 });

    let query = db
      .from("sights")
      .select("id, slug, name, summary, images, destination_id, provider, deeplink, gyg_id")
      .eq("destination_id", dst.id)
      .eq("status", "published")
      .order("name", { ascending: true });

    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return new Response(JSON.stringify(data ?? []), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    return Response.json([], { status: 200 });
  }
}
