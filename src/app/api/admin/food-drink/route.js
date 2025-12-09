import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("food_drink")
      .select(
        "id, slug, status, name, type, price_band, tags, booking_url, address, description, rating, images, destination_id, country_id, created_at, updated_at"
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
      .from("food_drink")
      .insert(body)
      .select("id")
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(
      { ok: true, id: data.id },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
