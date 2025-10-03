import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(_req, ctx) {
  try {
    const { id } = (await ctx.params) || {};
    if (!id) return NextResponse.json({ items: [] }, { status: 200 });
    const db = await getDB();
    // Prefer RPC if available; otherwise return empty for now
    let rows = [];
    try {
      const { data, error } = await db.rpc("get_divisions_for_destination", {
        dst_id: id,
      });
      if (!error && Array.isArray(data)) rows = data;
    } catch {}
    return new NextResponse(JSON.stringify({ items: rows }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (e) {
    return new NextResponse(JSON.stringify({ items: [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  }
}
