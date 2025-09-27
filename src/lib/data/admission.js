"use server";

import { createServiceClient } from "@/lib/supabase/service";

function coerceNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeRow(row = {}) {
  if (!row || typeof row !== "object") return null;
  const isFree = Boolean(row.is_free);
  const amount = isFree ? null : coerceNumber(row.amount);
  const currency = ((row.currency || "JPY") + "")
    .trim()
    .toUpperCase()
    .slice(0, 3);

  return {
    id: row.id || null,
    idx: typeof row.idx === "number" ? row.idx : coerceNumber(row.idx) ?? 0,
    subsection:
      typeof row.subsection === "string"
        ? row.subsection.trim() || null
        : row.subsection || null,
    label:
      typeof row.label === "string"
        ? row.label.trim()
        : "",
    min_age: coerceNumber(row.min_age),
    max_age: coerceNumber(row.max_age),
    requires_id: Boolean(row.requires_id),
    is_free: isFree,
    amount,
    currency: currency || "JPY",
    valid_from: row.valid_from || null,
    valid_to: row.valid_to || null,
    note:
      typeof row.note === "string"
        ? row.note.trim() || null
        : row.note || null,
  };
}

export async function fetchAdmissionPrices(sightId) {
  if (!sightId) return [];
  const db = createServiceClient();
  const { data, error } = await db
    .from("sight_admission_prices")
    .select(
      "id, idx, label, subsection, min_age, max_age, requires_id, is_free, amount, currency, valid_from, valid_to, note"
    )
    .eq("sight_id", sightId)
    .order("idx", { ascending: true });

  if (error) throw new Error(error.message || "Failed to load admission prices");
  return (Array.isArray(data) ? data : []).map((row, idx) => {
    const normalized = normalizeRow(row) || {};
    return { ...normalized, idx };
  });
}

export async function saveAdmissionPrices(sightId, rows) {
  if (!sightId) throw new Error("sightId is required");

  const list = Array.isArray(rows) ? rows : [];
  const normalizedRows = list.map((row, index) => {
    const normalized = normalizeRow({ ...row, idx: index }) || {};
    return {
      ...normalized,
      sight_id: sightId,
      idx: index,
    };
  });

  const db = createServiceClient();

  const existingIdsRes = await db
    .from("sight_admission_prices")
    .select("id")
    .eq("sight_id", sightId);

  if (existingIdsRes.error)
    throw new Error(existingIdsRes.error.message || "Failed to resolve current rows");

  const existingIds = new Set(
    (existingIdsRes.data || [])
      .map((row) => row.id)
      .filter((id) => typeof id === "string" && id)
  );

  const payloadIds = new Set(
    normalizedRows
      .map((row) => row.id)
      .filter((id) => typeof id === "string" && id)
  );

  const toDelete = [...existingIds].filter((id) => !payloadIds.has(id));

  if (toDelete.length > 0) {
    const { error: deleteError } = await db
      .from("sight_admission_prices")
      .delete()
      .in("id", toDelete);
    if (deleteError) throw new Error(deleteError.message || "Failed to delete old rows");
  }

  const preparedRows = normalizedRows.map((row) => {
    const currency = ((row.currency || "JPY") + "")
      .trim()
      .toUpperCase()
      .slice(0, 3);
    return {
      ...row,
      currency: currency || "JPY",
      amount: row.is_free ? null : coerceNumber(row.amount),
      external_url: null,
    };
  });

  const rowsWithId = [];
  const rowsWithoutId = [];

  for (const row of preparedRows) {
    if (row.id) {
      rowsWithId.push(row);
    } else {
      const { id, ...rest } = row;
      rowsWithoutId.push(rest);
    }
  }

  if (rowsWithoutId.length > 0) {
    const { error: insertError } = await db
      .from("sight_admission_prices")
      .insert(rowsWithoutId);
    if (insertError)
      throw new Error(insertError.message || "Failed to create admission prices");
  }

  if (rowsWithId.length > 0) {
    const { error: upsertError } = await db
      .from("sight_admission_prices")
      .upsert(rowsWithId, { onConflict: "id" });
    if (upsertError)
      throw new Error(upsertError.message || "Failed to save admission prices");
  }

  return fetchAdmissionPrices(sightId);
}
