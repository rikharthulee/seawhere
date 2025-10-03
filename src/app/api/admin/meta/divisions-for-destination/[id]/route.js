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
    return NextResponse.json({ items: rows }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}

