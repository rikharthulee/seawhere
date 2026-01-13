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

export async function POST(request) {
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

  if (placesError) {
    status = placesError?.status || "PLACES_ERROR";
  }

  if (!placesError && status === "OK" && places[0]) {
    const result = places[0];
    return NextResponse.json(
      {
        ok: true,
        status,
        place_id: result?.id || null,
        place_name: result?.displayName?.text || null,
        formatted_address: result?.formattedAddress || null,
        lat: result?.location?.latitude ?? null,
        lng: result?.location?.longitude ?? null,
      },
      { status: 200 }
    );
  }

  const params = new URLSearchParams({ address: query, key: apiKey });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    { cache: "no-store" }
  );
  const json = await res.json().catch(() => ({}));
  status = json?.status || status || "UNKNOWN";
  geocodeErrorMessage = json?.error_message || null;
  if (status === "OK" && Array.isArray(json?.results) && json.results[0]) {
    const result = json.results[0];
    return NextResponse.json(
      {
        ok: true,
        status,
        place_id: result?.place_id || null,
        place_name: result?.name || null,
        formatted_address: result?.formatted_address || null,
        lat: result?.geometry?.location?.lat ?? null,
        lng: result?.geometry?.location?.lng ?? null,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    {
      ok: false,
      status,
      error_message: geocodeErrorMessage || placesErrorMessage || null,
    },
    { status: 200 }
  );
}
