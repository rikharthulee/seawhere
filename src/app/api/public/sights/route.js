import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const client = createClient(url, key);
    // Fetch sights first without join to avoid relationship naming issues
    const sel = "id, slug, name, summary, images, destination_id, status, deeplink, provider, gyg_id";
    const { data: sights, error } = await client
      .from("sights")
      .select(sel)
      .eq("status", "published")
      .order("name", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const items = sights || [];
    // Map destination slugs in a second query
    const ids = Array.from(new Set(items.map((x) => x.destination_id).filter(Boolean)));
    let destMap = {};
    if (ids.length > 0) {
      const { data: dests, error: dErr } = await client
        .from("destinations")
        .select("id, slug, name")
        .in("id", ids);
      if (!dErr && dests) destMap = Object.fromEntries(dests.map((d) => [d.id, d]));
    }
    const withDest = items.map((x) => ({ ...x, destinations: destMap[x.destination_id] || null }));
    return NextResponse.json({ items: withDest });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
