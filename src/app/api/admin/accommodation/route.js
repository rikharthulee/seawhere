import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createClient({ cookies: cookieStore });
    const { data, error } = await supabase
      .from("accommodation")
      .select(
        "id, slug, name, summary, description, status, hero_image, thumbnail_image, images, credit, destination_id, prefecture_id, division_id, price_band, rating, website_url, affiliate_url, lat, lng, address"
      )
      .order("name", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const cookieStore = cookies();
    const supabase = createClient({ cookies: cookieStore });
    const { data, error } = await supabase
      .from("accommodation")
      .insert(body)
      .select("id, slug")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
