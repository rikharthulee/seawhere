import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
    let data, error;
    if (url && serviceKey) {
      const svc = createClient(url, serviceKey);
      const res = await svc
        .from("sights")
        .select("id, slug, name, summary, destination_id, status, images, lat, lng")
        .order("name", { ascending: true });
      data = res.data; error = res.error;
    } else {
      const cookieStore = await cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      const res = await supabase
        .from("sights")
        .select("id, slug, name, summary, destination_id, status, images, lat, lng")
        .order("name", { ascending: true });
      data = res.data; error = res.error;
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ items: data || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
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
      const cookieStore = await cookies();
      client = createRouteHandlerClient({ cookies: () => cookieStore });
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
      status: body.status || "draft",
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      tags: Array.isArray(body.tags) ? body.tags : null,
      duration_minutes: body.duration_minutes ?? null,
      provider: body.provider || null,
      deeplink: body.deeplink || null,
      gyg_id: body.gyg_id || null,
      price_amount: body.price_amount ?? null,
      price_currency: body.price_currency || null,
    };

    const { data, error } = await client
      .from("sights")
      .insert(payload)
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const sightId = data.id;

    // Insert opening hours
    const hours = Array.isArray(body.opening_hours) ? body.opening_hours : [];
    if (hours.length > 0) {
      const rows = hours.map((h, idx) => ({
        sight_id: sightId,
        weekday: typeof h.weekday === "number" ? h.weekday : Number(h.weekday) || 0,
        idx: h.idx ?? idx,
        open_time: h.open_time || null,
        close_time: h.close_time || null,
        is_closed: !!h.is_closed,
        valid_from: h.valid_from || null,
        valid_to: h.valid_to || null,
      }));
      const { error: hErr } = await client.from("sight_opening_hours").insert(rows);
      if (hErr) return NextResponse.json({ error: hErr.message }, { status: 400 });
    }

    // Insert exceptions
    const exceptions = Array.isArray(body.opening_exceptions) ? body.opening_exceptions : [];
    if (exceptions.length > 0) {
      const rows = exceptions.map((e) => ({
        sight_id: sightId,
        date: e.date,
        is_closed: e.is_closed === undefined ? true : !!e.is_closed,
        open_time: e.open_time || null,
        close_time: e.close_time || null,
        note: e.note || null,
      }));
      const { error: eErr } = await client.from("sight_opening_exceptions").insert(rows);
      if (eErr) return NextResponse.json({ error: eErr.message }, { status: 400 });
    }

    return NextResponse.json({ id: sightId });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
