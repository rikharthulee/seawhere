import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { fetchAdmissionPrices } from "@/lib/data/admission";

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
    let client;
    if (url && serviceKey) {
      client = createClient(url, serviceKey);
    } else {
      const cookieStore = cookies();
      client = createClient({ cookies: cookieStore });
    }

    const { data: sight, error } = await client
      .from("sights")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    if (!sight)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: hours } = await client
      .from("sight_opening_hours")
      .select(
        "weekday, idx, open_time, close_time, is_closed, valid_from, valid_to"
      )
      .eq("sight_id", id)
      .order("weekday", { ascending: true })
      .order("idx", { ascending: true });
    const { data: exceptions } = await client
      .from("sight_opening_exceptions")
      .select("date, is_closed, open_time, close_time, note")
      .eq("sight_id", id)
      .order("date", { ascending: true });

    let admission = [];
    try {
      admission = await fetchAdmissionPrices(id);
    } catch (admissionError) {
      console.error("Failed to load sight admission prices", admissionError);
    }

    return NextResponse.json({
      sight,
      hours: hours || [],
      exceptions: exceptions || [],
      admission,
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
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
      tags: Array.isArray(body.tags) ? body.tags : null,
      duration_minutes: body.duration_minutes ?? null,
      provider: body.provider || null,
      deeplink: body.deeplink || null,
      gyg_id: body.gyg_id || null,
      price_amount: body.price_amount ?? null,
      price_currency: body.price_currency || null,
    };
    const { error } = await client.from("sights").update(payload).eq("id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    // Replace hours and exceptions
    await client.from("sight_opening_hours").delete().eq("sight_id", id);
    const hours = Array.isArray(body.opening_hours) ? body.opening_hours : [];
    if (hours.length > 0) {
      const rows = hours.map((h, idx) => ({
        sight_id: id,
        weekday:
          typeof h.weekday === "number" ? h.weekday : Number(h.weekday) || 0,
        idx: h.idx ?? idx,
        open_time: h.open_time || null,
        close_time: h.close_time || null,
        is_closed: !!h.is_closed,
        valid_from: h.valid_from || null,
        valid_to: h.valid_to || null,
      }));
      const { error: hErr } = await client
        .from("sight_opening_hours")
        .insert(rows);
      if (hErr)
        return NextResponse.json({ error: hErr.message }, { status: 400 });
    }

    await client.from("sight_opening_exceptions").delete().eq("sight_id", id);
    const exceptions = Array.isArray(body.opening_exceptions)
      ? body.opening_exceptions
      : [];
    if (exceptions.length > 0) {
      const rows = exceptions.map((e) => ({
        sight_id: id,
        date: e.date,
        is_closed: e.is_closed === undefined ? true : !!e.is_closed,
        open_time: e.open_time || null,
        close_time: e.close_time || null,
        note: e.note || null,
      }));
      const { error: eErr } = await client
        .from("sight_opening_exceptions")
        .insert(rows);
      if (eErr)
        return NextResponse.json({ error: eErr.message }, { status: 400 });
    }

    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { id } = await params;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
    let client;
    if (url && serviceKey) {
      client = createClient(url, serviceKey);
    } else {
      const cookieStore = cookies();
      client = createClient({ cookies: cookieStore });
    }
    await client.from("sight_opening_hours").delete().eq("sight_id", id);
    await client.from("sight_opening_exceptions").delete().eq("sight_id", id);
    const { error } = await client.from("sights").delete().eq("id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
