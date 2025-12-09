import { getDB } from "@/lib/supabase/server";

export async function GET(_req, ctx) {
  try {
    const { slug } = (await ctx.params) || {};
    const db = await getDB();
    const { data, error } = await db
      .from("destinations")
      .select(
        "id, name, slug, status, country_id, destination_id, images, body_richtext, credit, lat, lng, published_at, gyg_location_id"
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return Response.json(null, { status: 404 });
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    return Response.json(null, { status: 404 });
  }
}
