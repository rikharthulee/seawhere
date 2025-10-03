import { getDB } from "@/lib/supabase/server";

export async function GET(_req, ctx) {
  const { slug } = (await ctx.params) || {};
  const db = await getDB();
  const { data, error } = await db
    .from("prefectures")
    .select("id, name, slug, region_id")
    .eq("slug", String(slug || "").trim())
    .maybeSingle();
  if (error || !data) return Response.json(null, { status: 404 });
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}

