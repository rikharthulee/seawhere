import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("accommodation")
      .select(
        "id, slug, name, summary, description, status, hero_image, thumbnail_image, images, credit, destination_id, country_id, price_band, rating, website_url, affiliate_url, lat, lng, address"
      )
      .order("name", { ascending: true });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ items: data ?? [] }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const db = await getDB();
    const { data, error } = await db
      .from("accommodation")
      .insert(body)
      .select("id, slug")
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(
      { ok: true, id: data.id, slug: data.slug },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
