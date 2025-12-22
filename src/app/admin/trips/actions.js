"use server";

import { getDB } from "@/lib/supabase/server";

function normalizeTripPayload(input = {}) {
  return {
    title: input.title ? String(input.title).trim() : null,
    summary: input.summary ? String(input.summary).trim() : null,
    country_id: input.country_id || null,
    destination_id: input.destination_id || null,
    status: input.status || "draft",
    visibility: input.visibility || "private",
  };
}

export async function createTrip(payload) {
  const db = await getDB();
  const insertPayload = normalizeTripPayload(payload);
  const { data, error } = await db
    .from("trips")
    .insert(insertPayload)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function updateTrip(tripId, payload) {
  const db = await getDB();
  const updatePayload = normalizeTripPayload(payload);
  const { error } = await db
    .from("trips")
    .update(updatePayload)
    .eq("id", tripId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function addTripDay(tripId) {
  const db = await getDB();
  const { data: lastDay, error: lastErr } = await db
    .from("trip_days")
    .select("day_index")
    .eq("trip_id", tripId)
    .order("day_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (lastErr) throw new Error(lastErr.message);
  const nextIndex = (lastDay?.day_index || 0) + 1;
  const { data, error } = await db
    .from("trip_days")
    .insert({ trip_id: tripId, day_index: nextIndex })
    .select(
      "id, trip_id, day_index, date, destination_id, accommodation_id, day_itinerary_id"
    )
    .single();
  if (error) throw new Error(error.message);
  return { day: data };
}

export async function updateTripDay(dayId, patch) {
  const db = await getDB();
  const payload = {};
  if ("date" in patch) payload.date = patch.date ?? null;
  if ("destination_id" in patch)
    payload.destination_id = patch.destination_id || null;
  if ("accommodation_id" in patch)
    payload.accommodation_id = patch.accommodation_id || null;
  if ("day_itinerary_id" in patch)
    payload.day_itinerary_id = patch.day_itinerary_id || null;
  const { error } = await db
    .from("trip_days")
    .update(payload)
    .eq("id", dayId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteTripDay(dayId) {
  const db = await getDB();
  const { error } = await db.from("trip_days").delete().eq("id", dayId);
  if (error) throw new Error(error.message);
  return { ok: true };
}
