import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// format helpers for exceptions (which keep full dates)
export function fromISODate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt) ? null : dt;
}
export function toISODate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function loadOpeningTimes(sightId) {
  const supabase = createClientComponentClient();
  const { data: hours, error: hErr } = await supabase
    .from("sight_opening_hours")
    .select("id, start_month, start_day, end_month, end_day, open_time, close_time, last_entry_mins")
    .eq("sight_id", sightId)
    .order("start_month", { ascending: true })
    .order("start_day", { ascending: true });
  if (hErr) throw hErr;

  const { data: closures, error: cErr } = await supabase
    .from("sight_opening_exceptions")
    .select("*")
    .eq("sight_id", sightId)
    .order("start_date", { ascending: true });
  if (cErr) throw cErr;

  return {
    hours: (hours || []).map((h) => ({
      id: h.id,
      startMonth: typeof h.start_month === "number" ? h.start_month : null,
      startDay: typeof h.start_day === "number" ? h.start_day : null,
      endMonth: typeof h.end_month === "number" ? h.end_month : null,
      endDay: typeof h.end_day === "number" ? h.end_day : null,
      openTime: h.open_time || "",
      closeTime: h.close_time || "",
      lastEntryMins: h.last_entry_mins ?? 0,
    })),
    closures: (closures || []).map((c) => ({
      id: c.id,
      type: c.type, // 'fixed'|'range'|'weekly'
      startDate: fromISODate(c.start_date),
      endDate: fromISODate(c.end_date),
      weekday: typeof c.weekday === "number" ? c.weekday : undefined,
      notes: c.note || "",
    })),
  };
}

// SIMPLE REPLACE STRATEGY: delete existing then insert current
export async function saveOpeningTimes(sightId, { hours, closures }) {
  const supabase = createClientComponentClient();
  const hourRows = (hours || [])
    .filter((h) =>
      h &&
      h.startMonth &&
      h.endMonth &&
      h.openTime &&
      h.closeTime
    )
    .map((h) => ({
      sight_id: sightId,
      start_month: Number(h.startMonth),
      start_day:
        h.startDay === undefined || h.startDay === null || h.startDay === ""
          ? null
          : Number(h.startDay),
      end_month: Number(h.endMonth),
      end_day:
        h.endDay === undefined || h.endDay === null || h.endDay === ""
          ? null
          : Number(h.endDay),
      open_time: h.openTime,
      close_time: h.closeTime,
      last_entry_mins: Number(h.lastEntryMins) || 0,
    }));

  const excRows = (closures || []).map((c) => ({
    sight_id: sightId,
    type: c.type,
    start_date: toISODate(c.startDate),
    end_date: toISODate(c.endDate),
    weekday:
      c.weekday === undefined || c.weekday === null || c.weekday === ""
        ? null
        : Number(c.weekday),
    note: c.notes || null,
  }));

  const { error: delH } = await supabase
    .from("sight_opening_hours")
    .delete()
    .eq("sight_id", sightId);
  if (delH) throw delH;

  const { error: delE } = await supabase
    .from("sight_opening_exceptions")
    .delete()
    .eq("sight_id", sightId);
  if (delE) throw delE;

  if (hourRows.length) {
    const { error } = await supabase
      .from("sight_opening_hours")
      .insert(hourRows);
    if (error) throw error;
  }
  if (excRows.length) {
    const { error } = await supabase
      .from("sight_opening_exceptions")
      .insert(excRows);
    if (error) throw error;
  }
  return true;
}
