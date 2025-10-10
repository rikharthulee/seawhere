import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";
import { buildTransportInsertRows } from "@/lib/server/excursions/transportLegs";

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

async function insertExcursionItems(db, excursionId, rawItems = []) {
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
      entityRows.push({
        excursion_id: excursionId,
        item_type: itemType,
        ref_id: refId,
        sort_order: sortOrder,
      });
      return;
    }

    if (itemType === "note") {
      const refId =
        typeof raw.ref_id === "string" && raw.ref_id.trim()
          ? raw.ref_id.trim()
          : null;
      const { title, details } = normalizeNoteDraft(raw);
      if (isUUID(refId)) {
        noteUpserts.push({
          id: refId,
          title,
          details,
        });
        noteLinkRows.push({
          excursion_id: excursionId,
          item_type: "note",
          ref_id: refId,
          sort_order: sortOrder,
        });
      } else if (title || details) {
        noteCreates.push({
          sort_order: sortOrder,
          title,
          details,
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
      .from("excursion_notes")
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
      .from("excursion_notes")
      .insert(insertPayload)
      .select("id");
    if (createErr) {
      return { error: createErr };
    }
    noteCreates.forEach((note, index) => {
      const created = createdNotes?.[index];
      if (created?.id) {
        noteLinkRows.push({
          excursion_id: excursionId,
          item_type: "note",
          ref_id: created.id,
          sort_order: note.sort_order,
        });
      }
    });
  }

  const linkRows = [...entityRows, ...noteLinkRows];
  if (linkRows.length === 0) {
    return { data: [] };
  }

  const { data, error } = await db
    .from("excursion_items")
    .insert(linkRows)
    .select("id, sort_order, item_type, ref_id");
  if (error) {
    return { error };
  }
  return { data };
}

export const runtime = "nodejs";
export const revalidate = 0;

export async function POST(request) {
  try {
    const db = await getDB();
    const body = await request.json();

    const tags = normalizeTags(body.tags);
    const payload = {
      name: body.name || null,
      slug: body.slug || null,
      summary: body.summary || null,
      description: body.description || null,
      cover_image: body.cover_image || null,
      maps_url: body.maps_url || null,
      destination_id: normalizeDestinationId(body.destination_id),
      status: body.status || "draft",
      tags: tags ?? null,
      cost_band: normalizeCostBand(body.cost_band),
      notes: normalizeNotes(body.notes),
      wheelchair_friendly: coerceNullableBoolean(
        body.wheelchair_friendly ?? body.accessible
      ),
      good_with_kids: coerceNullableBoolean(
        body.good_with_kids ?? body.with_kids
      ),
    };

    const { data, error } = await db
      .from("excursions")
      .insert(payload)
      .select("id")
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    const excursionId = data.id;
    const itemsResult = await insertExcursionItems(
      db,
      excursionId,
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
      excursionId,
      legs: Array.isArray(body.transport) ? body.transport : [],
      items: insertedItems,
    });
    if (transportLegs.length > 0) {
      const { error: transportErr } = await db
        .from("excursion_transport_legs")
        .insert(transportLegs);
      if (transportErr) {
        return NextResponse.json(
          { error: transportErr.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ id: excursionId }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const db = await getDB();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
    const q = (searchParams.get("q") || "").trim();
    const baseSelect = [
      "id",
      "name",
      "status",
      "updated_at",
      "summary",
      "destination_id",
      "excursion_transport_legs(count)",
    ];

    let query = db
      .from("excursions")
      .select(baseSelect.join(","))
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (q) {
      query = query.ilike("name", `%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "42703") {
        const fallbackSelect = baseSelect
          .filter(
            (field) =>
              field !== "updated_at" &&
              !field.startsWith("excursion_transport_legs")
          )
          .join(",");
        let fallback = db
          .from("excursions")
          .select(fallbackSelect)
          .order("name", { ascending: true })
          .limit(limit);

        if (q) {
          fallback = fallback.ilike("name", `%${q}%`);
        }

        const { data: fallbackData, error: fallbackError } = await fallback;
        if (fallbackError) {
          return NextResponse.json(
            { error: fallbackError.message },
            { status: 400 }
          );
        }
        return NextResponse.json({ items: fallbackData || [] });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ items: data || [] }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
