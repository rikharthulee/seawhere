import { getDB } from "@/lib/supabase/server";

function slugify(input) {
  return (
    String(input || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || null
  );
}

export async function GET(_req, ctx) {
  try {
    const { id } = (await ctx.params) || {};
    const db = await getDB();
    const { data, error } = await db
      .from("excursions")
      .select(
        "id, slug, name, description, summary, transport, maps_url, cover_image, updated_at, status"
      )
      .limit(200);
    if (error) return Response.json(null, { status: 404 });
    const rows = data || [];
    const target = String(id || "").toLowerCase();
    const match = rows.find((row) => {
      const s1 = String(row.slug || "").toLowerCase().trim();
      const s2 = slugify(row.name || row.title || row.id);
      return s1 === target || s2 === target || String(row.id).toLowerCase() === target;
    });
    if (!match) return Response.json(null, { status: 404 });
    return new Response(JSON.stringify(match), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    return Response.json(null, { status: 404 });
  }
}
