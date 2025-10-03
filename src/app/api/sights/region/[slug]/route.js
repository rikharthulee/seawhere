import { getDB } from "@/lib/supabase/server";

export async function GET(_req, ctx) {
  const { slug } = (await ctx.params) || {};
  const db = await getDB();
  const { data: region } = await db
    .from("regions")
    .select("id")
    .eq("slug", String(slug || "").trim())
    .maybeSingle();
  if (!region?.id) return Response.json([], { status: 200 });
  const { data: prefs } = await db
    .from("prefectures")
    .select("id")
    .eq("region_id", region.id);
  const prefIds = (prefs || []).map((p) => p.id).filter(Boolean);
  if (prefIds.length === 0) return Response.json([], { status: 200 });
  const { data: dests } = await db
    .from("destinations")
    .select("id")
    .in("prefecture_id", prefIds);
  const destIds = (dests || []).map((d) => d.id).filter(Boolean);
  if (destIds.length === 0) return Response.json([], { status: 200 });
  const { data } = await db
    .from("sights")
    .select("id, slug, name, summary, images, destination_id, status, destinations ( slug )")
    .in("destination_id", destIds)
    .eq("status", "published")
    .order("name", { ascending: true });
  return new Response(JSON.stringify(data ?? []), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}

