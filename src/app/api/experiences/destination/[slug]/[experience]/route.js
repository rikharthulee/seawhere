import { getDB } from "@/lib/supabase/server";

export async function GET(_req, ctx) {
  try {
    const { slug, experience } = (await ctx.params) || {};
    const db = await getDB();
    const { data: dst } = await db
      .from("destinations")
      .select("id, slug, name")
      .eq("slug", String(slug || "").trim())
      .maybeSingle();
    if (!dst?.id) return Response.json(null, { status: 404 });
    const { data, error } = await db
      .from("experiences")
      .select(
        "id, slug, name, summary, description, images, destination_id, status, provider, price_amount, price_currency, duration_minutes, tags"
      )
      .eq("destination_id", dst.id)
      .eq("slug", experience)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return Response.json(null, { status: 404 });
    return new Response(JSON.stringify({ experience: data, destination: dst }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    return Response.json(null, { status: 404 });
  }
}

