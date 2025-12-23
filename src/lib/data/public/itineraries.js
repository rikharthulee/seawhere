import { getPublicDB } from "@/lib/supabase/public";
import {
  DAY_ITINERARY_PUBLIC_COLUMNS,
  DAY_ITINERARY_LINK_COLUMNS,
  NOTE_PUBLIC_COLUMNS,
} from "@/lib/data/public/selects";

function isUUID(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(v || "").trim()
  );
}

const TABLE_INFO = {
  sight: {
    table: "sights",
    columns:
      "id,slug,name,summary,images,opening_times_url,destination_id,lat,lng",
  },
  experience: {
    table: "experiences",
    columns:
      "id,slug,name,summary,images,destination_id,status,provider,price_amount,price_currency,duration_minutes",
  },
  tour: {
    table: "tours",
    columns:
      "id,slug,name,summary,images,destination_id,status,provider,price_amount,price_currency,duration_minutes",
  },
  accommodation: {
    table: "accommodation",
    columns:
      "id,slug,name,summary,images,destination_id,price_band,rating",
  },
  food_drink: {
    table: "food_drink",
    columns:
      "id,slug,name,description,images,destination_id,type,price_band,rating",
  },
  note: {
    table: "day_itinerary_notes",
    columns: NOTE_PUBLIC_COLUMNS,
  },
};

function tableInfoForType(type) {
  const key = typeof type === "string" ? type.toLowerCase().trim() : "";
  return TABLE_INFO[key] || null;
}

function normalizeTransportSteps(rawSteps = null) {
  if (!rawSteps) return { steps: [], maps_url: null, details: null };
  if (Array.isArray(rawSteps))
    return { steps: rawSteps, maps_url: null, details: null };
  if (typeof rawSteps === "object") {
    const mapsUrl =
      typeof rawSteps.maps_url === "string" && rawSteps.maps_url.trim()
        ? rawSteps.maps_url.trim()
        : typeof rawSteps?.meta?.maps_url === "string"
          ? rawSteps.meta.maps_url.trim()
          : null;
    const details =
      typeof rawSteps.details === "string" && rawSteps.details.trim()
        ? rawSteps.details.trim()
        : typeof rawSteps?.meta?.details === "string"
          ? rawSteps.meta.details.trim()
          : null;
    const steps = Array.isArray(rawSteps.steps) ? rawSteps.steps : [];
    return { steps, maps_url: mapsUrl, details };
  }
  return { steps: [], maps_url: null, details: null };
}

function mapTransportLeg(row) {
  if (!row || typeof row !== "object") return null;
  const { steps: parsedSteps, maps_url, details } = normalizeTransportSteps(
    row.steps
  );
  return {
    id: row.id,
    day_itinerary_id: row.day_itinerary_id,
    from_item_id: row.from_item_id,
    to_item_id: row.to_item_id,
    template_id: row.template_id,
    primary_mode:
      typeof row.primary_mode === "string"
        ? row.primary_mode.toLowerCase()
        : null,
    title: row.title || null,
    summary: row.summary || details || null,
    steps: parsedSteps,
    est_duration_min:
      typeof row.est_duration_min === "number" ? row.est_duration_min : null,
    est_distance_m:
      typeof row.est_distance_m === "number" ? row.est_distance_m : null,
    est_cost_min: row.est_cost_min ?? null,
    est_cost_max: row.est_cost_max ?? null,
    currency: row.currency || null,
    notes: row.notes || null,
    maps_url,
    sort_order:
      typeof row.sort_order === "number" ? row.sort_order : null,
  };
}

async function fetchTransportLegs(supabase, dayItineraryId) {
  const { data, error } = await supabase
    .from("day_itinerary_transport_legs")
    .select(
      "id,day_itinerary_id,from_item_id,to_item_id,template_id,primary_mode,title,summary,steps,est_duration_min,est_distance_m,est_cost_min,est_cost_max,currency,notes,sort_order"
    )
    .eq("day_itinerary_id", dayItineraryId)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("[public:day-itineraries] transport select failed", {
      table: "day_itinerary_transport_legs",
      msg: error.message,
      dayItineraryId,
    });
    return [];
  }
  return (data || []).map(mapTransportLeg).filter(Boolean);
}

// Strict per-item hydrator. No batching, no normalization, no fallback requests.
export async function hydrateDayItineraryItems(supabase, items = []) {
  return Promise.all(
    (items || []).map(async (it, idx) => {
      const itemType = (it?.item_type || "").toLowerCase().trim();
      const info = tableInfoForType(itemType);
      const table = info?.table || null;
      const id =
        typeof it?.ref_id === "string" ? it.ref_id.trim() : it?.ref_id;
      if (!table) {
        if (itemType !== "meal" && itemType !== "custom") {
          console.warn("[public:day-itineraries] unknown item_type", {
            idx,
            item_type: it?.item_type,
          });
        }
        return { ...it, entity: null, table: null };
      }
      if (!isUUID(id)) {
        console.warn("[public:day-itineraries] invalid id", {
          idx,
          id: it?.ref_id,
        });
        return { ...it, entity: null, table };
      }
      const columns = info.columns;
      const { data, error, status } = await supabase
        .from(table)
        .select(columns)
        .eq("id", id)
        .maybeSingle();
      if (error) {
        console.error("[public:day-itineraries] select failed", {
          table,
          status,
          msg: error.message,
        });
        return { ...it, entity: null, table };
      }
      if (!data) {
        console.warn("[public:day-itineraries] entity not visible", {
          table,
          id,
        });
        return { ...it, entity: null, table };
      }
      return { ...it, entity: data, table };
    })
  );
}

export async function getCuratedDayItineraryBySlugPublic(slug) {
  const supabase = getPublicDB();
  const normalized = String(slug || "").trim();
  if (!normalized) {
    console.warn("[public:day-itineraries] invalid slug", { slug });
    return { dayItinerary: null, items: [], transport: [] };
  }

  const {
    data: dayItinerary,
    error: dayItineraryErr,
    status,
  } = await supabase
    .from("day_itineraries")
    .select(DAY_ITINERARY_PUBLIC_COLUMNS)
    .eq("slug", normalized)
    .eq("status", "published")
    .maybeSingle();
  if (dayItineraryErr) {
    console.error("[public:day-itineraries] select failed", {
      table: "day_itineraries",
      status,
      msg: dayItineraryErr.message,
    });
    return { dayItinerary: null, items: [], transport: [] };
  }
  if (!dayItinerary) {
    console.warn("[public:day-itineraries] entity not visible", {
      table: "day_itineraries",
      slug: normalized,
    });
    return { dayItinerary: null, items: [], transport: [] };
  }

  const { data: rawItems, error: itemsErr } = await supabase
    .from("day_itinerary_items")
    .select(DAY_ITINERARY_LINK_COLUMNS)
    .eq("day_itinerary_id", dayItinerary.id)
    .order("sort_order", { ascending: true });

  if (itemsErr) {
    console.error("[public:day-itineraries] select failed", {
      table: "day_itinerary_items",
      msg: itemsErr.message,
    });
    const transportFallback = await fetchTransportLegs(
      supabase,
      dayItinerary.id
    );
    return { dayItinerary, items: [], transport: transportFallback };
  }

  const items = await hydrateDayItineraryItems(supabase, rawItems || []);
  const transportLegs = await fetchTransportLegs(supabase, dayItinerary.id);
  return { dayItinerary, items, transport: transportLegs };
}

export async function getCuratedDayItineraryByIdPublic(id) {
  const supabase = getPublicDB();
  const normalized = String(id || "").trim();
  if (!isUUID(normalized)) {
    console.warn("[public:day-itineraries] invalid id", { id });
    return { dayItinerary: null, items: [], transport: [] };
  }

  const {
    data: dayItinerary,
    error: dayItineraryErr,
    status,
  } = await supabase
    .from("day_itineraries")
    .select(DAY_ITINERARY_PUBLIC_COLUMNS)
    .eq("id", normalized)
    .eq("status", "published")
    .maybeSingle();
  if (dayItineraryErr) {
    console.error("[public:day-itineraries] select failed", {
      table: "day_itineraries",
      status,
      msg: dayItineraryErr.message,
    });
    return { dayItinerary: null, items: [], transport: [] };
  }
  if (!dayItinerary) {
    console.warn("[public:day-itineraries] entity not visible", {
      table: "day_itineraries",
      id: normalized,
    });
    return { dayItinerary: null, items: [], transport: [] };
  }

  const { data: rawItems, error: itemsErr } = await supabase
    .from("day_itinerary_items")
    .select(DAY_ITINERARY_LINK_COLUMNS)
    .eq("day_itinerary_id", normalized)
    .order("sort_order", { ascending: true });

  if (itemsErr) {
    console.error("[public:day-itineraries] select failed", {
      table: "day_itinerary_items",
      msg: itemsErr.message,
    });
    const transportFallback = await fetchTransportLegs(
      supabase,
      dayItinerary.id
    );
    return { dayItinerary, items: [], transport: transportFallback };
  }

  const items = await hydrateDayItineraryItems(supabase, rawItems || []);
  const transportLegs = await fetchTransportLegs(supabase, dayItinerary.id);
  return { dayItinerary, items, transport: transportLegs };
}

// Simple public listing for the index page
export async function listPublishedDayItineraries({ limit = 200 } = {}) {
  const supabase = getPublicDB();
  const { data, error } = await supabase
    .from("day_itineraries")
    .select(
      "id, slug, name, summary, cover_image, tags, destination_id, status, updated_at, maps_url"
    )
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 0, 1), 500));
  if (error) throw error;
  return data || [];
}
