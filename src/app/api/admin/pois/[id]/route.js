import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
function dayNameToInt(name) {
  if (typeof name === "number") return name;
  if (name !== null && name !== undefined && name !== "") {
    const n = Number(name);
    if (!Number.isNaN(n) && n >= 0 && n <= 6) return n;
  }
  const map = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
  const key = String(name || "").slice(0, 3).toLowerCase();
  return map[key] ?? 0;
}

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: poi, error } = await supabase
      .from("poi")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!poi) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: rules } = await supabase
      .from("poi_opening_rules")
      .select("day_of_week, open_time, close_time")
      .eq("poi_id", id)
      .order("day_of_week", { ascending: true });
    const { data: exceptions } = await supabase
      .from("poi_opening_exceptions")
      .select("start_date, end_date, open_time, close_time, closed, note")
      .eq("poi_id", id)
      .order("start_date", { ascending: true });

    return NextResponse.json({ poi, rules: rules || [], exceptions: exceptions || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const body = await request.json();

    const payload = {
      type: body.type,
      title: body.title,
      summary: body.summary || null,
      details: body.details || null,
      destination_id: body.destination_id,
      status: body.status || "draft",
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      image: body.image || null,
      provider: body.provider || null,
      deeplink: body.deeplink || null,
      timezone: body.timezone || null,
    };
    const { error } = await supabase.from("poi").update(payload).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Replace rules/exceptions: delete then insert
    await supabase.from("poi_opening_rules").delete().eq("poi_id", id);
    const rules = Array.isArray(body.opening_rules) ? body.opening_rules : [];
    if (rules.length > 0) {
      const rows = rules.map((r) => ({
        poi_id: id,
        day_of_week: typeof r.day_of_week === "number" ? r.day_of_week : dayNameToInt(r.day_of_week),
        open_time: r.open_time || r.open || null,
        close_time: r.close_time || r.close || null,
      }));
      const { error: rErr } = await supabase.from("poi_opening_rules").insert(rows);
      if (rErr) return NextResponse.json({ error: rErr.message }, { status: 400 });
    }

    await supabase.from("poi_opening_exceptions").delete().eq("poi_id", id);
    const exceptions = Array.isArray(body.opening_exceptions) ? body.opening_exceptions : [];
    if (exceptions.length > 0) {
      const rows = exceptions.map((r) => ({
        poi_id: id,
        start_date: r.start_date || r.date,
        end_date: r.end_date || r.date,
        closed: r.closed === undefined ? true : !!r.closed,
        open_time: r.open_time || r.open || null,
        close_time: r.close_time || r.close || null,
        note: r.note || null,
      }));
      const { error: eErr } = await supabase.from("poi_opening_exceptions").insert(rows);
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
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    await supabase.from("poi_opening_rules").delete().eq("poi_id", id);
    await supabase.from("poi_opening_exceptions").delete().eq("poi_id", id);
    const { error } = await supabase.from("poi").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
