import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(_req, ctx) {
  const { id } = (await ctx.params) || {};
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  try {
    const db = await getDB();

    const { data: sight, error } = await db
      .from("sights")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    if (!sight)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: hours } = await db
      .from("sight_opening_hours")
      .select(
        "weekday, idx, open_time, close_time, is_closed, valid_from, valid_to"
      )
      .eq("sight_id", id)
      .order("weekday", { ascending: true })
      .order("idx", { ascending: true });
    const { data: exceptions } = await db
      .from("sight_opening_exceptions")
      .select("date, is_closed, open_time, close_time, note")
      .eq("sight_id", id)
      .order("date", { ascending: true });

    const { data: admissionRows, error: aErr } = await db
      .from("sight_admission_prices")
      .select(
        "id, idx, subsection, label, min_age, max_age, is_free, amount, currency, requires_id, valid_from, valid_to, note"
      )
      .eq("sight_id", id)
      .order("idx", { ascending: true });
    if (aErr) {
      return NextResponse.json({ error: aErr.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        sight,
        hours: hours || [],
        exceptions: exceptions || [],
        admission: admissionRows || [],
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function PUT(request, ctx) {
  const { id } = (await ctx.params) || {};
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  try {
    const db = await getDB();
    const body = await request.json();

    // Admission prices save action (from AdmissionEditor)
    if (body?._action === "saveAdmission") {
      const rows = Array.isArray(body.admission) ? body.admission : [];

      // Normalize rows
      const cleaned = rows.map((r, idx) => ({
        sight_id: id,
        idx: r.idx ?? idx,
        subsection: r.subsection ?? null,
        label: r.label ?? null,
        min_age: r.min_age === "" ? null : r.min_age ?? null,
        max_age: r.max_age === "" ? null : r.max_age ?? null,
        is_free: !!r.is_free,
        amount: r.amount === "" ? null : r.amount ?? null,
        currency: r.currency ?? "JPY",
        requires_id: !!r.requires_id,
        valid_from: r.valid_from || null,
        valid_to: r.valid_to || null,
        note: r.note ?? null,
      }));

      // Replace existing rows
      const { error: delErr } = await db
        .from("sight_admission_prices")
        .delete()
        .eq("sight_id", id);
      if (delErr)
        return NextResponse.json({ error: delErr.message }, { status: 400 });

      if (cleaned.length > 0) {
        const { error: insErr } = await db
          .from("sight_admission_prices")
          .insert(cleaned);
        if (insErr)
          return NextResponse.json({ error: insErr.message }, { status: 400 });
      }

      // Return fresh rows
      const { data: freshRows, error: fetchErr } = await db
        .from("sight_admission_prices")
        .select(
          "id, idx, subsection, label, min_age, max_age, is_free, amount, currency, requires_id, valid_from, valid_to, note"
        )
        .eq("sight_id", id)
        .order("idx", { ascending: true });
      if (fetchErr)
        return NextResponse.json({ error: fetchErr.message }, { status: 400 });

      return NextResponse.json(
        { ok: true, admission: freshRows || [] },
        { status: 200 }
      );
    }

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
    const { error } = await db.from("sights").update(payload).eq("id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    // Replace hours and exceptions
    await db.from("sight_opening_hours").delete().eq("sight_id", id);
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
      const { error: hErr } = await db.from("sight_opening_hours").insert(rows);
      if (hErr)
        return NextResponse.json({ error: hErr.message }, { status: 400 });
    }

    await db.from("sight_opening_exceptions").delete().eq("sight_id", id);
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
      const { error: eErr } = await db
        .from("sight_opening_exceptions")
        .insert(rows);
      if (eErr)
        return NextResponse.json({ error: eErr.message }, { status: 400 });
    }

    return NextResponse.json({ id }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function DELETE(_req, ctx) {
  const { id } = (await ctx.params) || {};
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  try {
    const db = await getDB();
    await db.from("sight_opening_hours").delete().eq("sight_id", id);
    await db.from("sight_opening_exceptions").delete().eq("sight_id", id);
    const { error } = await db.from("sights").delete().eq("id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
