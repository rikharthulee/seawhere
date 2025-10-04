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

    const [{ data: sight, error: sightErr }, { data: hours, error: hoursErr }, { data: exceptions, error: exceptionsErr }, { data: admissionRows, error: admissionErr }] =
      await Promise.all([
        db
          .from("sights")
          .select("*")
          .eq("id", id)
          .maybeSingle(),
        db
          .from("sight_opening_hours")
          .select(
            "id, sight_id, start_month, start_day, end_month, end_day, open_time, close_time, last_entry_mins, days, is_closed"
          )
          .eq("sight_id", id)
          .order("start_month", { ascending: true })
          .order("start_day", { ascending: true })
          .order("open_time", { ascending: true }),
        db
          .from("sight_opening_exceptions")
          .select("id, sight_id, type, start_date, end_date, weekday, note")
          .eq("sight_id", id)
          .order("start_date", { ascending: true })
          .order("weekday", { ascending: true }),
        db
          .from("sight_admission_prices")
          .select(
            "id, idx, subsection, label, min_age, max_age, is_free, amount, currency, requires_id, valid_from, valid_to, note"
          )
          .eq("sight_id", id)
          .order("idx", { ascending: true }),
      ]);

    if (sightErr)
      return NextResponse.json({ error: sightErr.message }, { status: 400 });
    if (!sight)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (hoursErr)
      return NextResponse.json({ error: hoursErr.message }, { status: 400 });
    if (exceptionsErr)
      return NextResponse.json({ error: exceptionsErr.message }, { status: 400 });
    if (admissionErr)
      return NextResponse.json({ error: admissionErr.message }, { status: 400 });

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
    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

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
      const rawHours = Array.isArray(ot.hours) ? ot.hours : [];
      const rawClosures = Array.isArray(ot.closures) ? ot.closures : [];
      const normalizeUrl = (value) => {
        if (typeof value !== "string") return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
      };
      const hasOfficialUrlField = Object.prototype.hasOwnProperty.call(
        ot,
        "officialUrl"
      );

      const { data: sightExists, error: sightLookupErr } = await db
        .from("sights")
        .select("id, opening_times_url")
        .eq("id", id)
        .maybeSingle();
      if (sightLookupErr)
        return NextResponse.json(
          { error: sightLookupErr.message },
          { status: 400 }
        );
      if (!sightExists) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const officialUrl = hasOfficialUrlField
        ? normalizeUrl(ot.officialUrl)
        : sightExists.opening_times_url ?? null;

      const clampInt = (value, { min, max, defaultValue = null } = {}) => {
        if (value === null || value === undefined || value === "") {
          return defaultValue;
        }
        const num = Number(value);
        if (!Number.isFinite(num)) return defaultValue;
        const int = Math.trunc(num);
        if (min !== undefined && int < min) return defaultValue;
        if (max !== undefined && int > max) return defaultValue;
        return int;
      };

      const toDateString = (value) => {
        if (!value) return null;
        if (value instanceof Date && !Number.isNaN(value.valueOf())) {
          return value.toISOString().slice(0, 10);
        }
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (!trimmed) return null;
          if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
          const parsed = new Date(trimmed);
          if (!Number.isNaN(parsed.valueOf())) {
            return parsed.toISOString().slice(0, 10);
          }
        }
        return null;
      };

      const normalizeDays = (value) => {
        if (!Array.isArray(value)) return [];
        const unique = new Set();
        for (const entry of value) {
          if (typeof entry !== "string") continue;
          const upper = entry.trim().toUpperCase();
          if (!upper) continue;
          unique.add(upper);
        }
        return Array.from(unique);
      };

      const normalizedHours = rawHours.map((hour) => {
        const openTime =
          typeof hour?.openTime === "string" ? hour.openTime.trim() : "";
        const closeTime =
          typeof hour?.closeTime === "string" ? hour.closeTime.trim() : "";
        const isClosed = !!hour?.isClosed;
        const lastEntry = clampInt(hour?.lastEntryMins, {
          min: 0,
          max: Number.MAX_SAFE_INTEGER,
          defaultValue: 0,
        });

        return {
          sight_id: id,
          start_month: clampInt(hour?.startMonth, { min: 1, max: 12 }),
          start_day: clampInt(hour?.startDay, { min: 1, max: 31 }),
          end_month: clampInt(hour?.endMonth, { min: 1, max: 12 }),
          end_day: clampInt(hour?.endDay, { min: 1, max: 31 }),
          open_time: isClosed ? null : openTime || null,
          close_time: isClosed ? null : closeTime || null,
          last_entry_mins: isClosed ? 0 : lastEntry ?? 0,
          days: normalizeDays(hour?.days),
          is_closed: isClosed,
        };
      });

      const allowedTypes = new Set(["fixed", "range", "weekly"]);
      const normalizedClosures = rawClosures.map((closure) => {
        let type = typeof closure?.type === "string" ? closure.type.toLowerCase() : "fixed";
        if (!allowedTypes.has(type)) type = "fixed";
        const weekday =
          type === "weekly"
            ? clampInt(closure?.weekday, { min: 0, max: 6 })
            : null;
        const startDate =
          type === "weekly" ? null : toDateString(closure?.startDate ?? null);
        const endDate =
          type === "range" ? toDateString(closure?.endDate ?? null) : null;
        const noteSource =
          typeof closure?.notes === "string"
            ? closure.notes
            : typeof closure?.note === "string"
            ? closure.note
            : "";

        return {
          sight_id: id,
          type,
          start_date: startDate,
          end_date: endDate,
          weekday,
          note: (noteSource || "").trim(),
        };
      });

      const previousStatePromise = Promise.all([
        db
          .from("sight_opening_hours")
          .select(
            "id, sight_id, start_month, start_day, end_month, end_day, open_time, close_time, last_entry_mins, days, is_closed"
          )
          .eq("sight_id", id),
        db
          .from("sight_opening_exceptions")
          .select("id, sight_id, type, start_date, end_date, weekday, note")
          .eq("sight_id", id),
      ]);

      const [
        { data: previousHours = [], error: previousHoursErr },
        { data: previousExceptions = [], error: previousExceptionsErr },
      ] = await previousStatePromise;

      if (previousHoursErr)
        return NextResponse.json(
          { error: previousHoursErr.message },
          { status: 400 }
        );
      if (previousExceptionsErr)
        return NextResponse.json(
          { error: previousExceptionsErr.message },
          { status: 400 }
        );

      const previousOfficialUrl = sightExists.opening_times_url ?? null;

      const restorePreviousState = async () => {
        await db.from("sight_opening_hours").delete().eq("sight_id", id);
        if (previousHours.length) {
          await db.from("sight_opening_hours").insert(previousHours);
        }
        await db
          .from("sight_opening_exceptions")
          .delete()
          .eq("sight_id", id);
        if (previousExceptions.length) {
          await db.from("sight_opening_exceptions").insert(previousExceptions);
        }
        await db
          .from("sights")
          .update({ opening_times_url: previousOfficialUrl })
          .eq("id", id);
      };

      const performReplace = async () => {
        const { error: deleteHoursErr } = await db
          .from("sight_opening_hours")
          .delete()
          .eq("sight_id", id);
        if (deleteHoursErr) throw deleteHoursErr;

        const { error: deleteExceptionsErr } = await db
          .from("sight_opening_exceptions")
          .delete()
          .eq("sight_id", id);
        if (deleteExceptionsErr) throw deleteExceptionsErr;

        if (normalizedHours.length) {
          const { error: insertHoursErr } = await db
            .from("sight_opening_hours")
            .insert(normalizedHours);
          if (insertHoursErr) throw insertHoursErr;
        }

        if (normalizedClosures.length) {
          const { error: insertExceptionsErr } = await db
            .from("sight_opening_exceptions")
            .insert(normalizedClosures);
          if (insertExceptionsErr) throw insertExceptionsErr;
        }

        if (hasOfficialUrlField) {
          const { error: updateSightErr } = await db
            .from("sights")
            .update({ opening_times_url: officialUrl })
            .eq("id", id);
          if (updateSightErr) throw updateSightErr;
        }
      };

      try {
        await performReplace();
      } catch (err) {
        try {
          await restorePreviousState();
        } catch (restoreErr) {
          console.error("Failed to restore opening times after error", {
            err: err?.message,
            restoreErr: restoreErr?.message,
          });
        }
        return NextResponse.json(
          { error: String(err?.message || err || "Failed to save opening times") },
          { status: 400 }
        );
      }

      const responseHours = normalizedHours.map((row) => ({
        startMonth: row.start_month ?? null,
        startDay: row.start_day ?? null,
        endMonth: row.end_month ?? null,
        endDay: row.end_day ?? null,
        openTime: row.open_time ?? "",
        closeTime: row.close_time ?? "",
        lastEntryMins: row.last_entry_mins ?? 0,
        days: row.days || [],
        isClosed: !!row.is_closed,
      }));

      const responseClosures = normalizedClosures.map((row) => ({
        type: row.type,
        startDate: row.start_date,
        endDate: row.end_date,
        weekday: row.weekday ?? null,
        notes: row.note || "",
      }));

      return NextResponse.json(
        {
          openingTimes: {
            hours: responseHours,
            closures: responseClosures,
            officialUrl:
              hasOfficialUrlField && officialUrl !== null
                ? officialUrl
                : hasOfficialUrlField
                ? ""
                : previousOfficialUrl ?? "",
          },
        },
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
