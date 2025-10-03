import { getDB } from "@/lib/supabase/server";

export async function GET(_req, ctx) {
  const { slug } = (await ctx.params) || {};
  const db = await getDB();
  const { data: div } = await db
    .from("divisions")
    .select("id")
    .eq("slug", String(slug || "").trim())
    .maybeSingle();
  if (!div?.id) return Response.json([], { status: 200 });
  const { data: dests } = await db
    .from("destinations")
    .select("id")
    .eq("division_id", div.id);
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

