import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);
    let client;
    try {
      client = createServiceClient();
    } catch (_) {
      client = createClient();
    }

    const { data, error } = await client
      .from("excursions")
      .select(
        "id, name, summary, description, images, transport, maps_url, status, updated_at"
      )
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ items: data || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
