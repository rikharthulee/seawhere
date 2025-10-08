import { getDB } from "@/lib/supabase/server";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";

export async function GET(_req, ctx) {
  try {
    const { id } = (await ctx.params) || {};
    const db = await getDB();
    const { data: items, error } = await db
      .from("excursion_items")
      .select("id, excursion_id, ref_id, item_type, sort_order")
      .eq("excursion_id", id)
      .order("sort_order", { ascending: true })
      .limit(500);
    if (error) return Response.json([], { status: 200 });

    const buckets = (items || []).reduce((acc, it) => {
      const t = String(it.item_type || "").toLowerCase().trim();
      if (!t) return acc;
      acc[t] = acc[t] || new Set();
      if (it.ref_id) acc[t].add(it.ref_id);
      return acc;
    }, {});

    const normId = (v) => String(v || "").trim().toLowerCase();

    async function fetchMap(table, cols, ids) {
      if (!ids || ids.length === 0) return new Map();
      const { data } = await db
        .from(table)
        .select(cols)
        .in("id", ids)
        .order("id", { ascending: true });
      const m = new Map();
      for (const row of data || []) m.set(normId(row.id), row);
      return m;
    }

    const maps = {};
    const tableByKind = { sight: "sights", experience: "experiences", tour: "tours" };
    await Promise.all(
      Object.keys(buckets).map(async (kind) => {
        const table = tableByKind[kind];
        if (!table) return;
        maps[kind] = await fetchMap(
          table,
          "id, slug, name, summary, description, images, duration_minutes, maps_url, opening_times_url",
          Array.from(buckets[kind])
        );
      })
    );

    const cols = "id, slug, name, summary, description, images, duration_minutes, maps_url, opening_times_url";
    const enriched = await Promise.all(
      (items || []).map(async (it) => {
        const t = String(it.item_type || "").toLowerCase().trim();
        const m = maps[t];
        let row = m ? m.get(normId(it.ref_id)) : null;
        if (!row && tableByKind[t]) {
          const { data } = await db
            .from(tableByKind[t])
            .select(cols)
            .eq("id", it.ref_id)
            .maybeSingle();
          row = data || null;
        }
        const displayName = row?.name || it.name || it.title || t || "Item";
        let displaySummary = null;
        if (row?.summary) displaySummary = row.summary;
        else if (typeof row?.description === "string" && row.description) {
          displaySummary = row.description;
        }
        let image = null;
        if (t === "sight" || t === "experience" || t === "tour") {
          image = firstImageFromImages(row?.images);
        }
        const displayImage = resolveImageUrl(image);
        return {
          ...it,
          displayName,
          displaySummary,
          displayImage,
          duration_minutes: row?.duration_minutes ?? null,
          maps_url: row?.maps_url || null,
          opening_times_url: row?.opening_times_url || null,
          slug: row?.slug || null,
        };
      })
    );

    return new Response(JSON.stringify(enriched), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (e) {
    return Response.json([], { status: 200 });
  }
}
