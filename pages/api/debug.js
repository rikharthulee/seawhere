import { getDB } from "@/lib/supabase/server";

export default async function handler(_req, res) {
  try {
    const db = await getDB();

    // 1) Are we hitting the right project?
    const which = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // 2) Count rows in the table (no filters)
    const {
      data: sampleAll,
      error: errAll,
      count: total,
    } = await supa
      .from("excursions")
      .select("id, slug, status, published, updated_at", { count: "exact" })
      .limit(5);

    // 3) What are the distinct status values? (helps catch 'Published' vs 'published')
    const { data: statusVals, error: errStatus } = await supa
      .from("excursions")
      .select("status")
      .not("status", "is", null);

    // 4) Try the published filter you use in the page
    const {
      data: sampleFiltered,
      error: errFiltered,
      count: filteredCount,
    } = await supa
      .from("excursions")
      .select("id, slug, status, published, updated_at", { count: "exact" })
      // adjust ONE of these to match your schema:
      .eq("status", "published")
      // .eq('published', true)
      // .eq('is_published', true)
      .order("updated_at", { ascending: false })
      .limit(5);

    res.status(200).json({
      whichSupabaseUrl: which,
      tableExists_totalRows: total ?? null,
      tableError: errAll?.message ?? null,
      sampleAll,
      distinctStatuses: Array.from(
        new Set((statusVals ?? []).map((r) => r.status))
      ),
      statusQueryError: errStatus?.message ?? null,
      filteredCount: filteredCount ?? null,
      filteredError: errFiltered?.message ?? null,
      sampleFiltered,
    });
  } catch (e) {
    res.status(500).json({ fatal: String(e?.message || e) });
  }
}
