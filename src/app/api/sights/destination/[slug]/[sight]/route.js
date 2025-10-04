import { getDB } from "@/lib/supabase/server";

export async function GET(_req, ctx) {
  try {
    const { slug, sight } = (await ctx.params) || {};
    const db = await getDB();
    const { data: dst } = await db
      .from("destinations")
      .select("id, slug, name")
      .eq("slug", String(slug || "").trim())
      .maybeSingle();
    if (!dst?.id) return Response.json(null, { status: 404 });
    const { data, error } = await db
      .from("sights")
      .select(
        "id, slug, name, summary, description, images, destination_id, lat, lng, status, duration_minutes, provider, deeplink, gyg_id, price_amount, price_currency, tags, opening_times_url"
      )
      .eq("destination_id", dst.id)
      .eq("slug", sight)
      .eq("status", "published")
      .maybeSingle();
    if (error || !data) return Response.json(null, { status: 404 });
    const [hoursRes, exceptionsRes] = await Promise.all([
      db
        .from("sight_opening_hours")
        .select(
          "start_month, start_day, end_month, end_day, open_time, close_time, last_entry_mins, days, is_closed"
        )
        .eq("sight_id", data.id)
        .order("start_month", { ascending: true })
        .order("start_day", { ascending: true })
        .order("open_time", { ascending: true }),
      db
        .from("sight_opening_exceptions")
        .select("type, start_date, end_date, weekday, note")
        .eq("sight_id", data.id)
        .order("start_date", { ascending: true })
        .order("weekday", { ascending: true }),
    ]);

    const trimTime = (value) => {
      if (!value) return "";
      const match = String(value).match(/^([0-9]{1,2}:[0-9]{2})/);
      return match ? match[1] : String(value);
    };

    const normalizedHours = (hoursRes?.data ?? []).map((row) => {
      const isClosed = !!row.is_closed;
      return {
        startMonth: row.start_month ?? null,
        startDay: row.start_day ?? null,
        endMonth: row.end_month ?? null,
        endDay: row.end_day ?? null,
        openTime: isClosed ? "" : trimTime(row.open_time),
        closeTime: isClosed ? "" : trimTime(row.close_time),
        lastEntryMins: isClosed ? 0 : row.last_entry_mins ?? 0,
        days: Array.isArray(row.days) ? row.days : [],
        isClosed,
      };
    });

    const normalizedClosures = (exceptionsRes?.data ?? []).map((row) => {
      const rawWeekday = row.weekday;
      const parsedWeekday =
        rawWeekday === null || rawWeekday === undefined
          ? null
          : Number(rawWeekday);
      const weekday = Number.isInteger(parsedWeekday) ? parsedWeekday : null;

      return {
        type: row.type || "fixed",
        startDate: row.start_date || null,
        endDate: row.end_date || null,
        weekday,
        notes: row.note || "",
      };
    });

    const openingTimes = {
      hours: normalizedHours,
      closures: normalizedClosures,
      officialUrl: data.opening_times_url || "",
    };

    return new Response(
      JSON.stringify({ sight: data, destination: dst, openingTimes }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (e) {
    return Response.json(null, { status: 404 });
  }
}
