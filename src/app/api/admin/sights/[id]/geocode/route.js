import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 0;

async function requireAdmin(db) {
  const { data: auth } = await db.auth.getUser();
  const user = auth?.user || null;
  if (!user) return { ok: false };
  const { data: prof } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (prof && ["admin", "editor"].includes(prof.role)) return { ok: true };
  return { ok: false };
}

export async function POST(request, ctx) {
  const { id } = (await ctx.params) || {};
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const db = await getDB();
  const auth = await requireAdmin(db);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY is not set" },
      { status: 500 }
    );
  }

  const placesRes = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 1 }),
      cache: "no-store",
    }
  );
  const placesJson = await placesRes.json().catch(() => ({}));
  const placesError = placesJson?.error || null;
  const places = Array.isArray(placesJson?.places) ? placesJson.places : [];
  let status = places.length > 0 ? "OK" : "ZERO_RESULTS";
  const placesErrorMessage = placesError?.message || null;
  let geocodeErrorMessage = null;
  const nowIso = new Date().toISOString();

  const updatePayload = {
    geocode_status: status,
    geocoded_at: nowIso,
  };

  if (placesError) {
    status = placesError?.status || "PLACES_ERROR";
    updatePayload.geocode_status = status;
    updatePayload.geocode_source = "places";
  } else if (status === "OK" && places[0]) {
    const result = places[0];
    updatePayload.lat = result?.location?.latitude ?? null;
    updatePayload.lng = result?.location?.longitude ?? null;
    updatePayload.geocoded_address = result?.formattedAddress || null;
    updatePayload.geocode_place_id = result?.id || null;
    updatePayload.geocoded_place_name = result?.displayName?.text || null;
    updatePayload.geocode_source = "places";
  } else {
    const params = new URLSearchParams({ address: query, key: apiKey });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
      { cache: "no-store" }
    );
    const json = await res.json().catch(() => ({}));
    status = json?.status || status || "UNKNOWN";
    geocodeErrorMessage = json?.error_message || null;
    updatePayload.geocode_status = status;
    if (status === "OK" && Array.isArray(json?.results) && json.results[0]) {
      const result = json.results[0];
      updatePayload.lat = result?.geometry?.location?.lat ?? null;
      updatePayload.lng = result?.geometry?.location?.lng ?? null;
      updatePayload.geocoded_address = result?.formatted_address || null;
      updatePayload.geocode_place_id = result?.place_id || null;
      updatePayload.geocoded_place_name = result?.name || null;
      updatePayload.geocode_source = "geocode";
    } else {
      updatePayload.geocode_source = "geocode";
    }
  }

  const { data: updated, error: updateErr } = await db
    .from("sights")
    .update(updatePayload)
    .eq("id", id)
    .select(
      "id, lat, lng, geocoded_address, geocode_place_id, geocoded_place_name, geocode_source, geocode_status, geocoded_at"
    )
    .maybeSingle();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  if (status !== "OK") {
    return NextResponse.json(
      {
        ok: false,
        status,
        error_message: geocodeErrorMessage || placesErrorMessage || null,
        sight: updated || null,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { ok: true, status, sight: updated || null },
    { status: 200 }
  );
}
