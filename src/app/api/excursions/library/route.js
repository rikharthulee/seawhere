import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);
    const db = await getDB();

    const { data, error } = await db
      .from("excursions")
      .select(
        "id, name, summary, description, images, transport, maps_url, status, updated_at"
      )
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ items: data || [] }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
