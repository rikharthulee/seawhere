import { getDB } from "@/lib/supabase/server";

export async function GET(_req, ctx) {
  try {
    const { slug, sight } = (await ctx.params) || {};
    const db = await getDB();
    const { data: dst } = await db
      .from("destinations")
      .select("id, slug, name")
      .eq("slug", String(slug || "").trim())
      .maybeSingle();
    if (!dst?.id) return Response.json(null, { status: 404 });
    const { data, error } = await db
      .from("sights")
      .select(
        "id, slug, name, summary, description, images, destination_id, lat, lng, status, duration_minutes, provider, deeplink, gyg_id, price_amount, price_currency, tags, opening_times_url"
      )
      .eq("destination_id", dst.id)
      .eq("slug", sight)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return Response.json(null, { status: 404 });
    return new Response(JSON.stringify({ sight: data, destination: dst }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    return Response.json(null, { status: 404 });
  }
}

