import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(_req, ctx) {
  try {
    const { id } = (await ctx.params) || {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const db = await getDB();
    const { data: experience, error } = await db
      .from("experiences")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    if (!experience)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: rules } = await db
      .from("experience_availability_rules")
      .select("idx, days_of_week, start_times, valid_from, valid_to, timezone")
      .eq("experience_id", id)
      .order("idx", { ascending: true });
    const { data: exceptions } = await db
      .from("experience_exceptions")
      .select("date, action, start_time, note")
      .eq("experience_id", id)
      .order("date", { ascending: true });

    return NextResponse.json(
      {
        ...experience,
        rules: rules || [],
        exceptions: exceptions || [],
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
  try {
    const { id } = (await ctx.params) || {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const db = await getDB();
    const body = await request.json();

    const payload = {
      name: body.name,
      slug: body.slug,
      summary: body.summary || null,
      description: body.description || null,
      body_richtext: body.body_richtext || null,
      images: Array.isArray(body.images) ? body.images : body.images || null,
      country_id: body.country_id,
      destination_id: body.destination_id,
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
    const { error } = await db.from("experiences").update(payload).eq("id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    await db
      .from("experience_availability_rules")
      .delete()
      .eq("experience_id", id);
    const rules = Array.isArray(body.availability_rules)
      ? body.availability_rules
      : [];
    if (rules.length > 0) {
      const rows = rules.map((r, idx) => ({
        experience_id: id,
        idx: r.idx ?? idx,
        days_of_week: r.days_of_week || [0],
        start_times: r.start_times || [],
        valid_from: r.valid_from || null,
        valid_to: r.valid_to || null,
        timezone: r.timezone || "Asia/Tokyo",
      }));
      const { error: rErr } = await db
        .from("experience_availability_rules")
        .insert(rows);
      if (rErr)
        return NextResponse.json({ error: rErr.message }, { status: 400 });
    }

    await db.from("experience_exceptions").delete().eq("experience_id", id);
    const exceptions = Array.isArray(body.exceptions) ? body.exceptions : [];
    if (exceptions.length > 0) {
      const rows = exceptions.map((e) => ({
        experience_id: id,
        date: e.date,
        action: e.action || "cancel",
        start_time: e.start_time || null,
        note: e.note || null,
      }));
      const { error: eErr } = await db
        .from("experience_exceptions")
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
  try {
    const { id } = (await ctx.params) || {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const db = await getDB();
    await db
      .from("experience_availability_rules")
      .delete()
      .eq("experience_id", id);
    await db.from("experience_exceptions").delete().eq("experience_id", id);
    const { error } = await db.from("experiences").delete().eq("id", id);
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
