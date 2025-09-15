import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

async function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  if (url && serviceKey) return createClient(url, serviceKey);
  const cookieStore = await cookies();
  return createRouteHandlerClient({ cookies: () => cookieStore });
}

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const client = await getClient();
    const { data: tour, error } = await client
      .from("tours")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!tour) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: rules } = await client
      .from("tour_availability_rules")
      .select("idx, days_of_week, start_times, valid_from, valid_to, timezone")
      .eq("tour_id", id)
      .order("idx", { ascending: true });
    const { data: exceptions } = await client
      .from("tour_exceptions")
      .select("date, action, start_time, note")
      .eq("tour_id", id)
      .order("date", { ascending: true });

    return NextResponse.json({ tour, rules: rules || [], exceptions: exceptions || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const client = await getClient();
    const body = await request.json();

    const payload = {
      name: body.name,
      slug: body.slug,
      summary: body.summary || null,
      description: body.description || null,
      body_richtext: body.body_richtext || null,
      images: Array.isArray(body.images) ? body.images : body.images || null,
      destination_id: body.destination_id,
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
    const { error } = await client.from("tours").update(payload).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await client.from("tour_availability_rules").delete().eq("tour_id", id);
    const rules = Array.isArray(body.availability_rules) ? body.availability_rules : [];
    if (rules.length > 0) {
      const rows = rules.map((r, idx) => ({
        tour_id: id,
        idx: r.idx ?? idx,
        days_of_week: r.days_of_week || [0],
        start_times: r.start_times || [],
        valid_from: r.valid_from || null,
        valid_to: r.valid_to || null,
        timezone: r.timezone || "Asia/Tokyo",
      }));
      const { error: rErr } = await client.from("tour_availability_rules").insert(rows);
      if (rErr) return NextResponse.json({ error: rErr.message }, { status: 400 });
    }

    await client.from("tour_exceptions").delete().eq("tour_id", id);
    const exceptions = Array.isArray(body.exceptions) ? body.exceptions : [];
    if (exceptions.length > 0) {
      const rows = exceptions.map((e) => ({
        tour_id: id,
        date: e.date,
        action: e.action || "cancel",
        start_time: e.start_time || null,
        note: e.note || null,
      }));
      const { error: eErr } = await client.from("tour_exceptions").insert(rows);
      if (eErr) return NextResponse.json({ error: eErr.message }, { status: 400 });
    }

    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { id } = await params;
    const client = await getClient();
    await client.from("tour_availability_rules").delete().eq("tour_id", id);
    await client.from("tour_exceptions").delete().eq("tour_id", id);
    const { error } = await client.from("tours").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
