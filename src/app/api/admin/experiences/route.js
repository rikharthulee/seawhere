import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
    let data, error;
    if (url && serviceKey) {
      const svc = createClient(url, serviceKey);
      const res = await svc
        .from("experiences")
        .select(
          "id, slug, name, summary, destination_id, status, images, lat, lng"
        )
        .order("name", { ascending: true });
      data = res.data;
      error = res.error;
    } else {
      const cookieStore = cookies();
      const supabase = createClient({ cookies: cookieStore });
      const res = await supabase
        .from("experiences")
        .select(
          "id, slug, name, summary, destination_id, status, images, lat, lng"
        )
        .order("name", { ascending: true });
      data = res.data;
      error = res.error;
    }
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ items: data || [] });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
    let client;
    if (url && serviceKey) {
      client = createClient(url, serviceKey);
    } else {
      const cookieStore = cookies();
      client = createClient({ cookies: cookieStore });
    }
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
      // normalize price
      price:
        body.price ||
        (body.price_amount != null
          ? {
              amount: body.price_amount,
              currency: body.price_currency || "JPY",
            }
          : null),
      price_amount: body.price_amount ?? null,
      price_currency: body.price_currency || null,
      duration_minutes: body.duration_minutes ?? null,
      provider: body.provider || null,
      deeplink: body.deeplink || null,
      gyg_id: body.gyg_id || null,
      tags: Array.isArray(body.tags) ? body.tags : null,
    };

    const { data, error } = await client
      .from("experiences")
      .insert(payload)
      .select("id")
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    const expId = data.id;

    // Availability rules
    const rules = Array.isArray(body.availability_rules)
      ? body.availability_rules
      : [];
    if (rules.length > 0) {
      const rows = rules.map((r, idx) => ({
        experience_id: expId,
        idx: r.idx ?? idx,
        days_of_week: r.days_of_week || [0],
        start_times: r.start_times || [],
        valid_from: r.valid_from || null,
        valid_to: r.valid_to || null,
        timezone: r.timezone || "Asia/Tokyo",
      }));
      const { error: rErr } = await client
        .from("experience_availability_rules")
        .insert(rows);
      if (rErr)
        return NextResponse.json({ error: rErr.message }, { status: 400 });
    }

    // Exceptions
    const exceptions = Array.isArray(body.exceptions) ? body.exceptions : [];
    if (exceptions.length > 0) {
      const rows = exceptions.map((e) => ({
        experience_id: expId,
        date: e.date,
        action: e.action || "cancel",
        start_time: e.start_time || null,
        note: e.note || null,
      }));
      const { error: eErr } = await client
        .from("experience_exceptions")
        .insert(rows);
      if (eErr)
        return NextResponse.json({ error: eErr.message }, { status: 400 });
    }

    return NextResponse.json({ id: expId });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
