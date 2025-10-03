import { getDB } from "@/lib/supabase/server";

export async function GET(_req, ctx) {
  try {
    const { slug } = (await ctx.params) || {};
    const db = await getDB();
    const { data, error } = await db
      .from("accommodation")
      .select(
        "slug,name,summary,description,images,status,credit,price_band,rating,website_url,affiliate_url,lat,lng,address,destination_id,prefecture_id,division_id"
      )
      .eq("slug", slug)
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

