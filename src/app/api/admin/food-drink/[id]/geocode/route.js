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

  const params = new URLSearchParams({ address: query, key: apiKey });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
    { cache: "no-store" }
  );
  const json = await res.json().catch(() => ({}));
  const status = json?.status || "UNKNOWN";
  const nowIso = new Date().toISOString();

  const updatePayload = {
    geocode_status: status,
    geocoded_at: nowIso,
  };

  if (status === "OK" && Array.isArray(json?.results) && json.results[0]) {
    const result = json.results[0];
    updatePayload.lat = result?.geometry?.location?.lat ?? null;
    updatePayload.lng = result?.geometry?.location?.lng ?? null;
    updatePayload.geocoded_address = result?.formatted_address || null;
    updatePayload.geocode_place_id = result?.place_id || null;
  }

  const { data: updated, error: updateErr } = await db
    .from("food_drink")
    .update(updatePayload)
    .eq("id", id)
    .select(
      "id, lat, lng, geocoded_address, geocode_place_id, geocode_status, geocoded_at"
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
        error_message: json?.error_message || null,
        food_drink: updated || null,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { ok: true, status, food_drink: updated || null },
    { status: 200 }
  );
}
