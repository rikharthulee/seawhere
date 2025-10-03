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
      const t = String(it.item_type || "").toLowerCase();
      if (!t) return acc;
      acc[t] = acc[t] || new Set();
      if (it.ref_id) acc[t].add(it.ref_id);
      return acc;
    }, {});

    async function fetchMap(table, cols, ids) {
      if (!ids || ids.length === 0) return new Map();
      const { data } = await db.from(table).select(cols).in("id", ids);
      const m = new Map();
      for (const row of data || []) m.set(row.id, row);
      return m;
    }

    const maps = {};
    if (buckets.sight && buckets.sight.size > 0) {
      maps.sight = await fetchMap(
        "sights",
        "id, name, summary, description, images, duration_minutes, maps_url",
        Array.from(buckets.sight)
      );
    }
    if (buckets.experience && buckets.experience.size > 0) {
      maps.experience = await fetchMap(
        "experiences",
        "id, name, summary, description, images, duration_minutes, maps_url",
        Array.from(buckets.experience)
      );
    }
    if (buckets.tour && buckets.tour.size > 0) {
      maps.tour = await fetchMap(
        "tours",
        "id, name, summary, description, images, duration_minutes, maps_url",
        Array.from(buckets.tour)
      );
    }

    const enriched = (items || []).map((it) => {
      const t = String(it.item_type || "").toLowerCase();
      const m = maps[t];
      const row = m ? m.get(it.ref_id) : null;
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
      };
    });

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

