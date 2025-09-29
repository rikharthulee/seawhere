import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("tours")
      .select(
        "id, slug, name, summary, destination_id, status, images, lat, lng, duration_minutes, provider, deeplink, gyg_id, price_amount, price_currency"
      )
      .order("name", { ascending: true });
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

export async function POST(request) {
  try {
    const db = await getDB();
    const body = await request.json();

    const payload = {
      name: body.name,
      slug: body.slug,
      summary: body.summary || null,
      description: body.description || null,
      body_richtext: body.body_richtext || null,
      images: Array.isArray(body.images) ? body.images : body.images || null,
      destination_id: body.destination_id,
      division_id: body.division_id ?? null,
      status: body.status || "draft",
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      duration_minutes: body.duration_minutes ?? null,
      provider: body.provider || null,
      deeplink: body.deeplink || null,
      gyg_id: body.gyg_id || null,
      tags: Array.isArray(body.tags) ? body.tags : null,
      price_amount: body.price_amount ?? null,
      price_currency: body.price_currency || null,
    };

    const { data, error } = await db
      .from("tours")
      .insert(payload)
      .select("id")
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    const tourId = data.id;

    const rules = Array.isArray(body.availability_rules)
      ? body.availability_rules
      : [];
    if (rules.length > 0) {
      const rows = rules.map((r, idx) => ({
        tour_id: tourId,
        idx: r.idx ?? idx,
        days_of_week: r.days_of_week || [0],
        start_times: r.start_times || [],
        valid_from: r.valid_from || null,
        valid_to: r.valid_to || null,
        timezone: r.timezone || "Asia/Tokyo",
      }));
      const { error: rErr } = await db
        .from("tour_availability_rules")
        .insert(rows);
      if (rErr)
        return NextResponse.json({ error: rErr.message }, { status: 400 });
    }

    const exceptions = Array.isArray(body.exceptions) ? body.exceptions : [];
    if (exceptions.length > 0) {
      const rows = exceptions.map((e) => ({
        tour_id: tourId,
        date: e.date,
        action: e.action || "cancel",
        start_time: e.start_time || null,
        note: e.note || null,
      }));
      const { error: eErr } = await db.from("tour_exceptions").insert(rows);
      if (eErr)
        return NextResponse.json({ error: eErr.message }, { status: 400 });
    }

    return NextResponse.json({ id: tourId }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
