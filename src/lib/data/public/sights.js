import { getPublicDB } from "@/lib/supabase/public";
import { SIGHT_PUBLIC_COLUMNS } from "@/lib/data/public/selects";

function isUUID(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(v || "").trim()
  );
}

export async function listPublishedSights() {
  const db = getPublicDB();
  const { data, error } = await db
    .from("sights")
    .select(
      "id, slug, name, summary, images, destination_id, country_id, status, destinations ( slug, countries ( slug ) )"
    )
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listSightsByDestinationSlug(destinationSlug) {
  const db = getPublicDB();
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name, country_id, countries ( slug )")
    .eq("slug", String(destinationSlug || "").trim())
    .maybeSingle();
  if (!dst?.id) return { destination: null, sights: [] };
  const { data, error } = await db
    .from("sights")
    .select(
      "id, slug, name, summary, images, destination_id, country_id, status, destinations ( slug, countries ( slug ) )"
    )
    .eq("destination_id", dst.id)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return { destination: dst, sights: data ?? [] };
}

const trimTime = (value) => {
  if (!value) return "";
  const match = String(value).match(/^([0-9]{1,2}:[0-9]{2})/);
  return match ? match[1] : String(value);
};

async function loadSightMeta(db, sightId) {
  const [hoursRes, exceptionsRes, admissionsRes] = await Promise.all([
    db
      .from("sight_opening_hours")
      .select(
        "start_month, start_day, end_month, end_day, open_time, close_time, last_entry_mins, days, is_closed"
      )
      .eq("sight_id", sightId)
      .order("start_month", { ascending: true })
      .order("start_day", { ascending: true })
      .order("open_time", { ascending: true }),
    db
      .from("sight_opening_exceptions")
      .select("type, start_date, end_date, weekday, note")
      .eq("sight_id", sightId)
      .order("start_date", { ascending: true })
      .order("weekday", { ascending: true }),
    db
      .from("sight_admission_prices")
      .select(
        "id, idx, subsection, label, min_age, max_age, is_free, amount, currency, requires_id, valid_from, valid_to, note"
      )
      .eq("sight_id", sightId)
      .order("idx", { ascending: true }),
  ]);

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

  return {
    openingTimes: {
      hours: normalizedHours,
      closures: normalizedClosures,
      officialUrl: "",
    },
    admissions: admissionsRes?.data ?? [],
  };
}

export async function getSightBySlugPublic(slug) {
  const db = getPublicDB();
  const normalized = String(slug || "").trim();
  if (!normalized) {
    console.warn("[public:sights] invalid slug", { slug });
    return { sight: null, destination: null, admissions: [], openingTimes: null };
  }

  const { data, error, status } = await db
    .from("sights")
    .select(
      `${SIGHT_PUBLIC_COLUMNS}, destinations ( id, slug, name, country_id, countries ( slug, name ) )`
    )
    .eq("slug", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[public:sights] select failed", {
      table: "sights",
      status,
      msg: error.message,
    });
    return { sight: null, destination: null, admissions: [], openingTimes: null };
  }

  if (!data) {
    console.warn("[public:sights] entity not visible", {
      table: "sights",
      slug: normalized,
    });
    return { sight: null, destination: null, admissions: [], openingTimes: null };
  }

  const { destinations: destinationRaw, ...sight } = data;
  const destination = destinationRaw || null;

  const { openingTimes, admissions } = await loadSightMeta(db, sight.id);

  const mergedOpeningTimes = {
    ...(openingTimes || {}),
    officialUrl: sight.opening_times_url || openingTimes?.officialUrl || "",
  };

  return {
    sight,
    destination,
    admissions,
    openingTimes: mergedOpeningTimes,
  };
}

export async function getSightByIdPublic(id) {
  const db = getPublicDB();
  const normalized = String(id || "").trim();
  if (!isUUID(normalized)) {
    console.warn("[public:sights] invalid id", { id });
    return { sight: null, destination: null, admissions: [], openingTimes: null };
  }

  const { data, error, status } = await db
    .from("sights")
    .select(
      `${SIGHT_PUBLIC_COLUMNS}, destinations ( id, slug, name, country_id, countries ( slug, name ) )`
    )
    .eq("id", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[public:sights] select failed", {
      table: "sights",
      status,
      msg: error.message,
    });
    return { sight: null, destination: null, admissions: [], openingTimes: null };
  }

  if (!data) {
    console.warn("[public:sights] entity not visible", {
      table: "sights",
      id: normalized,
    });
    return { sight: null, destination: null, admissions: [], openingTimes: null };
  }

  const { destinations: destinationRaw, ...sight } = data;
  const destination = destinationRaw || null;
  const { openingTimes, admissions } = await loadSightMeta(db, sight.id);
  const mergedOpeningTimes = {
    ...(openingTimes || {}),
    officialUrl: sight.opening_times_url || openingTimes?.officialUrl || "",
  };

  return {
    sight,
    destination,
    admissions,
    openingTimes: mergedOpeningTimes,
  };
}

export async function getSightBySlugsPublic({
  countrySlug,
  destinationSlug,
  sightSlug,
}) {
  const db = getPublicDB();
  const normalizedSight = String(sightSlug || "").trim();
  const normalizedDestination = String(destinationSlug || "").trim();
  const normalizedCountry = String(countrySlug || "").trim();
  if (!normalizedSight || !normalizedDestination || !normalizedCountry) {
    console.warn("[public:sights] invalid slug set", {
      countrySlug,
      destinationSlug,
      sightSlug,
    });
    return {
      sight: null,
      destination: null,
      admissions: [],
      openingTimes: null,
    };
  }

  const { data: dst, error: dstErr } = await db
    .from("destinations")
    .select("id, slug, name, country_id, countries ( slug, name )")
    .eq("slug", normalizedDestination)
    .maybeSingle();
  if (dstErr) {
    console.error("[public:sights] destination lookup failed", {
      slug: normalizedDestination,
      msg: dstErr.message,
    });
    return {
      sight: null,
      destination: null,
      admissions: [],
      openingTimes: null,
    };
  }
  if (!dst?.id) {
    return {
      sight: null,
      destination: null,
      admissions: [],
      openingTimes: null,
    };
  }
  const countryMatches =
    String(dst?.countries?.slug || "").toLowerCase() ===
    normalizedCountry.toLowerCase();
  if (!countryMatches) {
    return {
      sight: null,
      destination: null,
      admissions: [],
      openingTimes: null,
    };
  }

  const { data, error, status } = await db
    .from("sights")
    .select(
      `${SIGHT_PUBLIC_COLUMNS}, destinations ( id, slug, name, country_id, countries ( slug, name ) )`
    )
    .eq("slug", normalizedSight)
    .eq("destination_id", dst.id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[public:sights] select failed", {
      table: "sights",
      status,
      msg: error.message,
      destinationId: dst.id,
    });
    return {
      sight: null,
      destination: null,
      admissions: [],
      openingTimes: null,
    };
  }

  if (!data) {
    return {
      sight: null,
      destination: null,
      admissions: [],
      openingTimes: null,
    };
  }

  const { destinations: destinationRaw, ...sight } = data;
  const destination = destinationRaw || null;

  const { openingTimes, admissions } = await loadSightMeta(db, sight.id);

  const mergedOpeningTimes = {
    ...(openingTimes || {}),
    officialUrl: sight.opening_times_url || openingTimes?.officialUrl || "",
  };

  return {
    sight,
    destination,
    admissions,
    openingTimes: mergedOpeningTimes,
  };
}
