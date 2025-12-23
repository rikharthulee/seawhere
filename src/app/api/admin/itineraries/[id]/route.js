import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";
import {
  buildTransportInsertRows,
  extractTransportLegs,
} from "@/lib/server/dayItineraries/transportLegs";

export const runtime = "nodejs";
export const revalidate = 0;

const VALID_COST_BANDS = new Set(["budget", "midrange", "premium"]);
const LEGACY_COST_BAND_MAP = new Map([
  ["£", "budget"],
  ["££", "midrange"],
  ["£££", "premium"],
  ["€", "budget"],
  ["€€", "midrange"],
  ["€€€", "premium"],
]);
const ENTITY_ITEM_TYPES = new Set([
  "sight",
  "experience",
  "tour",
  "accommodation",
  "food_drink",
]);
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function coerceNullableBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return null;
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return null;
  const tags = value
    .map((tag) => (typeof tag === "string" ? tag.trim() : String(tag || "")))
    .filter(Boolean);
  return tags.length > 0 ? tags : [];
}

function normalizeList(value) {
  if (!Array.isArray(value)) return null;
  const list = value
    .map((item) => (typeof item === "string" ? item.trim() : String(item || "")))
    .filter(Boolean);
  return list.length > 0 ? list : [];
}

function normalizeNotes(value) {
  if (Array.isArray(value)) {
    const text = value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean)
      .join("\n\n");
    if (text) return text;
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function normalizeDestinationId(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return value;
}

function normalizeCostBand(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const legacy = LEGACY_COST_BAND_MAP.get(trimmed);
  if (legacy && VALID_COST_BANDS.has(legacy)) return legacy;
  const normalized = trimmed.toLowerCase();
  return VALID_COST_BANDS.has(normalized) ? normalized : null;
}

function isUUID(value) {
  return UUID_REGEX.test(String(value || "").trim());
}

function normalizeSortOrder(raw, idx) {
  const num = Number(raw);
  if (Number.isFinite(num)) return num;
  return (idx + 1) * 10;
}

function normalizeNoteDraft(raw = {}) {
  const title =
    typeof raw.title === "string" && raw.title.trim().length > 0
      ? raw.title.trim()
      : null;
  const details =
    typeof raw.details === "string" && raw.details.length > 0
      ? raw.details
      : null;
  return { title, details };
}

async function insertDayItineraryItems(db, dayItineraryId, rawItems = []) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { data: [] };
  }

  const entityRows = [];
  const noteLinkRows = [];
  const noteCreates = [];
  const noteUpserts = [];

  rawItems.forEach((raw, idx) => {
    if (!raw || typeof raw !== "object") return;
    const itemType = String(raw.item_type || "").toLowerCase().trim();
    const sortOrder = normalizeSortOrder(raw.sort_order, idx);

    if (ENTITY_ITEM_TYPES.has(itemType)) {
      const refId =
        typeof raw.ref_id === "string" && raw.ref_id.trim()
          ? raw.ref_id.trim()
          : null;
      if (!refId) return;
      const details =
        typeof raw.details === "string" && raw.details.trim().length > 0
          ? raw.details.trim()
          : null;
      const duration =
        raw.duration_minutes === "" || raw.duration_minutes === null
          ? null
          : Number(raw.duration_minutes);
      const durationMinutes = Number.isFinite(duration) ? duration : null;
      const mapsUrl =
        typeof raw.maps_url === "string" && raw.maps_url.trim().length > 0
          ? raw.maps_url.trim()
          : null;
      entityRows.push({
        day_itinerary_id: dayItineraryId,
        item_type: itemType,
        ref_id: refId,
        sort_order: sortOrder,
        details,
        duration_minutes: durationMinutes,
        maps_url: mapsUrl,
        is_optional: Boolean(raw.is_optional),
        meal_type: null,
      });
      return;
    }

    if (itemType === "meal") {
      const details =
        typeof raw.details === "string" && raw.details.trim().length > 0
          ? raw.details.trim()
          : null;
      const duration =
        raw.duration_minutes === "" || raw.duration_minutes === null
          ? null
          : Number(raw.duration_minutes);
      const durationMinutes = Number.isFinite(duration) ? duration : null;
      const mapsUrl =
        typeof raw.maps_url === "string" && raw.maps_url.trim().length > 0
          ? raw.maps_url.trim()
          : null;
      const mealType =
        typeof raw.meal_type === "string" && raw.meal_type.trim().length > 0
          ? raw.meal_type.trim()
          : null;
      noteLinkRows.push({
        day_itinerary_id: dayItineraryId,
        item_type: "meal",
        ref_id: null,
        sort_order: sortOrder,
        details,
        duration_minutes: durationMinutes,
        maps_url: mapsUrl,
        is_optional: Boolean(raw.is_optional),
        meal_type: mealType,
      });
      return;
    }

    if (itemType === "note") {
      const refId =
        typeof raw.ref_id === "string" && raw.ref_id.trim()
          ? raw.ref_id.trim()
          : null;
      const { title, details } = normalizeNoteDraft(raw);
      const isOptional = Boolean(raw.is_optional);
      if (isUUID(refId)) {
        noteUpserts.push({
          id: refId,
          title,
          details,
        });
        noteLinkRows.push({
          day_itinerary_id: dayItineraryId,
          item_type: "note",
          ref_id: refId,
          sort_order: sortOrder,
          details: null,
          duration_minutes: null,
          maps_url: null,
          is_optional: isOptional,
          meal_type: null,
        });
      } else if (title || details) {
        noteCreates.push({
          sort_order: sortOrder,
          title,
          details,
          is_optional: isOptional,
        });
      }
    }
  });

  if (noteUpserts.length > 0) {
    const updatePayload = noteUpserts.map((note) => ({
      id: note.id,
      title: note.title,
      details: note.details,
    }));
    const { error: updateErr } = await db
      .from("day_itinerary_notes")
      .upsert(updatePayload);
    if (updateErr) {
      return { error: updateErr };
    }
  }

  if (noteCreates.length > 0) {
    const insertPayload = noteCreates.map((note) => ({
      title: note.title,
      details: note.details,
    }));
    const { data: createdNotes, error: createErr } = await db
      .from("day_itinerary_notes")
      .insert(insertPayload)
      .select("id");
    if (createErr) {
      return { error: createErr };
    }
    noteCreates.forEach((note, index) => {
      const created = createdNotes?.[index];
      if (created?.id) {
        noteLinkRows.push({
          day_itinerary_id: dayItineraryId,
          item_type: "note",
          ref_id: created.id,
          sort_order: note.sort_order,
          details: null,
          duration_minutes: null,
          maps_url: null,
          is_optional: Boolean(note.is_optional),
          meal_type: null,
        });
      }
    });
  }

  const linkRows = [...entityRows, ...noteLinkRows];
  if (linkRows.length === 0) {
    return { data: [] };
  }

  const { data, error } = await db
    .from("day_itinerary_items")
    .insert(linkRows)
    .select("id, sort_order, item_type, ref_id");
  if (error) {
    return { error };
  }
  return { data };
}

export async function GET(_req, ctx) {
  try {
    const { id } = (await ctx.params) || {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const db = await getDB();
    const { data: dayItinerary, error } = await db
      .from("day_itineraries")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    if (!dayItinerary)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: items } = await db
      .from("day_itinerary_items")
      .select(
        "id, item_type, ref_id, sort_order, details, duration_minutes, maps_url, is_optional, meal_type"
      )
      .eq("day_itinerary_id", id)
      .order("sort_order", { ascending: true });

    const { data: transportRows, error: transportErr } = await db
      .from("day_itinerary_transport_legs")
      .select(
        "id, primary_mode, title, summary, steps, est_duration_min, est_distance_m, est_cost_min, est_cost_max, currency, notes, sort_order, template_id, from_item_id, to_item_id"
      )
      .eq("day_itinerary_id", id)
      .order("sort_order", { ascending: true });

    if (transportErr) {
      console.error("[admin:day-itineraries] transport select failed", {
        dayItineraryId: id,
        msg: transportErr.message,
      });
    }

    const enriched = await enrichItems(db, items || []);

    const legsFromTable = transportErr
      ? []
      : extractTransportLegs(transportRows);
    const transport = legsFromTable;
    return NextResponse.json(
      { ...dayItinerary, transport, items: enriched },
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

    const tags = normalizeTags(body.tags);
    const highlights = normalizeList(body.highlights);
    const includes = normalizeList(body.includes);
    const notSuitableFor = normalizeList(body.not_suitable_for);
    const importantInformation = normalizeList(body.important_information);
    const payload = {
      name: body.name || null,
      slug: body.slug || null,
      summary: body.summary || null,
      description: body.description || null,
      full_description: body.full_description || null,
      cover_image: body.cover_image || null,
      maps_url: body.maps_url || null,
      destination_id: normalizeDestinationId(body.destination_id),
      status: body.status || "draft",
      tags: tags ?? null,
      highlights: highlights ?? null,
      includes: includes ?? null,
      not_suitable_for: notSuitableFor ?? null,
      important_information: importantInformation ?? null,
      cost_band: normalizeCostBand(body.cost_band),
      notes: normalizeNotes(body.notes),
      wheelchair_friendly: coerceNullableBoolean(
        body.wheelchair_friendly ?? body.accessible
      ),
      good_with_kids: coerceNullableBoolean(
        body.good_with_kids ?? body.with_kids
      ),
    };
    const { error } = await db
      .from("day_itineraries")
      .update(payload)
      .eq("id", id);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    const { error: deleteLegsErr } = await db
      .from("day_itinerary_transport_legs")
      .delete()
      .eq("day_itinerary_id", id);
    if (deleteLegsErr) {
      return NextResponse.json(
        { error: deleteLegsErr.message },
        { status: 400 }
      );
    }

    await db.from("day_itinerary_items").delete().eq("day_itinerary_id", id);
    const itemsResult = await insertDayItineraryItems(
      db,
      id,
      Array.isArray(body.items) ? body.items : []
    );
    if (itemsResult.error) {
      return NextResponse.json(
        { error: itemsResult.error.message },
        { status: 400 }
      );
    }
    const insertedItems = itemsResult.data || [];

    const transportLegs = buildTransportInsertRows({
      dayItineraryId: id,
      legs: Array.isArray(body.transport) ? body.transport : [],
      items: insertedItems,
    });
    if (transportLegs.length > 0) {
      const { error: transportErr } = await db
        .from("day_itinerary_transport_legs")
        .insert(transportLegs);
      if (transportErr) {
        return NextResponse.json(
          { error: transportErr.message },
          { status: 400 }
        );
      }
    }
    return NextResponse.json({ id }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, ctx) {
  try {
    const { id } = (await ctx.params) || {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const db = await getDB();
    const { error: legsErr } = await db
      .from("day_itinerary_transport_legs")
      .delete()
      .eq("day_itinerary_id", id);
    if (legsErr) {
      return NextResponse.json({ error: legsErr.message }, { status: 400 });
    }

    const { error: itemsErr } = await db
      .from("day_itinerary_items")
      .delete()
      .eq("day_itinerary_id", id);
    if (itemsErr) {
      return NextResponse.json({ error: itemsErr.message }, { status: 400 });
    }
    const { error } = await db
      .from("day_itineraries")
      .delete()
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

const TABLE_BY_KIND = {
  sight: "sights",
  experience: "experiences",
  tour: "tours",
  accommodation: "accommodation",
  food_drink: "food_drink",
  note: "day_itinerary_notes",
};

async function enrichItems(db, items) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const grouped = items.reduce(
    (acc, item) => {
      const kind = item?.item_type;
      if (!kind || !TABLE_BY_KIND[kind]) return acc;
      if (!acc[kind]) {
        acc[kind] = new Set();
      }
      if (item.ref_id) {
        acc[kind].add(item.ref_id);
      }
      return acc;
    },
    {}
  );

  const detailMaps = {};
  await Promise.all(
    Object.entries(grouped).map(async ([kind, idSet]) => {
      if (idSet.size === 0) return;
      const table = TABLE_BY_KIND[kind];
      const ids = Array.from(idSet);
      const { data } = await db
        .from(table)
        .select(
          kind === "note"
            ? "id, title, details"
            : "id, name, destinations ( name )"
        )
        .in("id", ids);
      const map = new Map();
      for (const row of data || []) {
        if (kind === "note") {
          map.set(row.id, {
            title: row.title || "Note",
            details: row.details || "",
          });
        } else {
          map.set(row.id, {
            name: row.name,
            destination: row?.destinations?.name || null,
          });
        }
      }
      detailMaps[kind] = map;
    })
  );

  return items.map((item) => {
    const detailMap = detailMaps[item.item_type];
    const detail = detailMap ? detailMap.get(item.ref_id) : undefined;
    if (item.item_type === "note") {
      return {
        ...item,
        title: detail?.title || item.title || "Note",
        details: detail?.details ?? item.details ?? "",
      };
    }
    return {
      ...item,
      name: detail?.name || null,
      destination: detail?.destination || null,
    };
  });
}
