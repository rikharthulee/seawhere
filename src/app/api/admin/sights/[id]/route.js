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
        "id, start_month, start_day, end_month, end_day, open_time, close_time, last_entry_mins"
      )
      .eq("sight_id", id)
      .order("start_month", { ascending: true })
      .order("start_day", { ascending: true });

    const { data: exceptions } = await db
      .from("sight_opening_exceptions")
      .select("id, type, start_date, end_date, weekday, note")
      .eq("sight_id", id)
      .order("start_date", { ascending: true });

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

    // Opening times save action (from OpeningTimesEditor)
    if (body?._action === "saveOpeningTimes") {
      const ot = body.openingTimes || {};
      const hours = Array.isArray(ot.hours) ? ot.hours : [];
      const closures = Array.isArray(ot.closures) ? ot.closures : [];
      const officialUrl = ot.officialUrl || null;

      // Replace seasons/hours
      await db.from("sight_opening_hours").delete().eq("sight_id", id);
      if (hours.length > 0) {
        const rows = hours.map((h) => ({
          sight_id: id,
          start_month: h.startMonth ?? null,
          start_day: h.startDay ?? null,
          end_month: h.endMonth ?? null,
          end_day: h.endDay ?? null,
          open_time: h.openTime || null,
          close_time: h.closeTime || null,
          last_entry_mins:
            typeof h.lastEntryMins === "number" ? h.lastEntryMins : null,
        }));
        const { error: hErr } = await db
          .from("sight_opening_hours")
          .insert(rows);
        if (hErr)
          return NextResponse.json({ error: hErr.message }, { status: 400 });
      }

      // Replace closures/exceptions
      await db.from("sight_opening_exceptions").delete().eq("sight_id", id);
      if (closures.length > 0) {
        const rows = closures.map((c) => ({
          sight_id: id,
          type: c.type || "fixed",
          start_date: c.startDate || null,
          end_date: c.endDate || null,
          weekday: typeof c.weekday === "number" ? c.weekday : null,
          note: c.notes || null,
        }));
        const { error: eErr } = await db
          .from("sight_opening_exceptions")
          .insert(rows);
        if (eErr)
          return NextResponse.json({ error: eErr.message }, { status: 400 });
      }

      // Save officialUrl into sights table
      if (officialUrl !== undefined) {
        const { error: urlErr } = await db
          .from("sights")
          .update({ opening_times_url: officialUrl })
          .eq("id", id);
        if (urlErr)
          return NextResponse.json({ error: urlErr.message }, { status: 400 });
      }

      // Return fresh openingTimes
      return NextResponse.json(
        { ok: true, openingTimes: { hours, closures, officialUrl } },
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
