import { getPublicDB } from "@/lib/supabase/public";
import { listDestinationsByPrefectureId, listDestinationsByDivisionId } from "@/lib/data/public/geo";

export async function listPublishedSights() {
  const db = getPublicDB();
  const { data, error } = await db
    .from("sights")
    .select("id, slug, name, summary, images, destination_id, status, destinations ( slug )")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listSightsByDestinationSlug(destinationSlug, divisionSlug = null) {
  const db = getPublicDB();
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name")
    .eq("slug", String(destinationSlug || "").trim())
    .maybeSingle();
  if (!dst?.id) return { destination: null, sights: [] };
  let query = db
    .from("sights")
    .select("id, slug, name, summary, images, destination_id, status, destinations ( slug )")
    .eq("destination_id", dst.id)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (divisionSlug) {
    const { data: div } = await db
      .from("divisions")
      .select("id")
      .eq("slug", String(divisionSlug).trim())
      .maybeSingle();
    if (!div?.id) return { destination: dst, sights: [] };
    query = query.eq("division_id", div.id);
  }
  const { data, error } = await query;
  if (error) throw error;
  return { destination: dst, sights: data ?? [] };
}

export async function getSightBySlugsPublic(destinationSlug, sightSlug) {
  const db = getPublicDB();
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name")
    .eq("slug", String(destinationSlug || "").trim())
    .maybeSingle();
  if (!dst?.id) return null;
  const { data, error } = await db
    .from("sights")
    .select(
      "id, slug, name, summary, description, body_richtext, images, destination_id, lat, lng, status, duration_minutes, provider, deeplink, gyg_id, price_amount, price_currency, tags, opening_times_url"
    )
    .eq("destination_id", dst.id)
    .eq("slug", sightSlug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  const [hoursRes, exceptionsRes, admissionsRes] = await Promise.all([
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
    db
      .from("sight_admission_prices")
      .select(
        "id, idx, subsection, label, min_age, max_age, is_free, amount, currency, requires_id, valid_from, valid_to, note"
      )
      .eq("sight_id", data.id)
      .order("idx", { ascending: true }),
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

  return {
    sight: data,
    destination: dst,
    admissions: admissionsRes?.data ?? [],
    openingTimes,
  };
}

export async function listSightsByRegionSlug(regionSlug) {
  const db = getPublicDB();
  const { data: region } = await db
    .from("regions")
    .select("id")
    .eq("slug", String(regionSlug || "").trim())
    .maybeSingle();
  if (!region?.id) return [];
  const { data: prefs } = await db
    .from("prefectures")
    .select("id")
    .eq("region_id", region.id);
  const prefIds = (prefs || []).map((p) => p.id).filter(Boolean);
  if (prefIds.length === 0) return [];
  const { data: dests } = await db
    .from("destinations")
    .select("id")
    .in("prefecture_id", prefIds);
  const destIds = (dests || []).map((d) => d.id).filter(Boolean);
  if (destIds.length === 0) return [];
  const { data, error } = await db
    .from("sights")
    .select("id, slug, name, summary, images, destination_id, status, destinations ( slug )")
    .in("destination_id", destIds)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listSightsByPrefectureSlug(prefSlug) {
  const db = getPublicDB();
  const { data: pref } = await db
    .from("prefectures")
    .select("id")
    .eq("slug", String(prefSlug || "").trim())
    .maybeSingle();
  if (!pref?.id) return [];
  const dests = await listDestinationsByPrefectureId(pref.id);
  const destIds = dests.map((d) => d.id).filter(Boolean);
  if (destIds.length === 0) return [];
  const { data, error } = await db
    .from("sights")
    .select("id, slug, name, summary, images, destination_id, status, destinations ( slug )")
    .in("destination_id", destIds)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listSightsByDivisionSlug(divSlug) {
  const db = getPublicDB();
  const { data: div } = await db
    .from("divisions")
    .select("id")
    .eq("slug", String(divSlug || "").trim())
    .maybeSingle();
  if (!div?.id) return [];
  const dests = await listDestinationsByDivisionId(div.id);
  const destIds = dests.map((d) => d.id).filter(Boolean);
  if (destIds.length === 0) return [];
  const { data, error } = await db
    .from("sights")
    .select("id, slug, name, summary, images, destination_id, status, destinations ( slug )")
    .in("destination_id", destIds)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
