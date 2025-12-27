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

function normalizePhotos(photos = [], maxCount = 12) {
  const normalized = photos
    .map((photo) => {
      const width = Number(photo?.widthPx || 0);
      const height = Number(photo?.heightPx || 0);
      return {
        name: photo?.name || null,
        widthPx: Number.isFinite(width) ? width : null,
        heightPx: Number.isFinite(height) ? height : null,
        authorAttributions: Array.isArray(photo?.authorAttributions)
          ? photo.authorAttributions
          : [],
        area: Number.isFinite(width) && Number.isFinite(height) ? width * height : 0,
      };
    })
    .filter((photo) => photo.name);

  return normalized
    .sort((a, b) => (b.area || 0) - (a.area || 0))
    .slice(0, maxCount)
    .map(({ area, ...rest }) => rest);
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

  const { data: accommodation, error: fetchErr } = await db
    .from("accommodation")
    .select("id, google_place_id")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 400 });
  }
  if (!accommodation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!accommodation.google_place_id) {
    return NextResponse.json(
      { error: "google_place_id is required to sync photos" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY is not set" },
      { status: 500 }
    );
  }

  const nowIso = new Date().toISOString();

  try {
    const placesRes = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(
        accommodation.google_place_id
      )}`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "id,displayName,formattedAddress,photos",
        },
        cache: "no-store",
      }
    );
    const placesJson = await placesRes.json().catch(() => ({}));
    const placesError = placesJson?.error || null;
    if (!placesRes.ok || placesError) {
      const message =
        placesError?.message ||
        placesJson?.error_message ||
        `Places API error (${placesRes.status})`;
      const { error: updateErr } = await db
        .from("accommodation")
        .update({
          google_photos_status: "ERROR",
          google_photos_error: message,
          google_photos_synced_at: nowIso,
        })
        .eq("id", id);
      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }
      return NextResponse.json(
        { ok: false, accommodation_id: id, status: "ERROR", error: message },
        { status: 200 }
      );
    }

    const photos = normalizePhotos(placesJson?.photos || []);
    const placeName = placesJson?.displayName?.text || null;
    const formattedAddress = placesJson?.formattedAddress || null;

    const { data: updated, error: updateErr } = await db
      .from("accommodation")
      .update({
        google_photos: photos,
        google_place_name: placeName,
        google_formatted_address: formattedAddress,
        google_photos_synced_at: nowIso,
        google_photos_status: "OK",
        google_photos_error: null,
      })
      .eq("id", id)
      .select(
        "id, google_photos, google_place_name, google_formatted_address, google_photos_status, google_photos_error, google_photos_synced_at"
      )
      .maybeSingle();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        ok: true,
        accommodation_id: id,
        photo_count: photos.length,
        place_name: placeName,
        formatted_address: formattedAddress,
        status: "OK",
        accommodation: updated || null,
      },
      { status: 200 }
    );
  } catch (e) {
    const message = e?.message || "Failed to sync photos";
    const { error: updateErr } = await db
      .from("accommodation")
      .update({
        google_photos_status: "ERROR",
        google_photos_error: message,
        google_photos_synced_at: nowIso,
      })
      .eq("id", id);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }
    return NextResponse.json(
      { ok: false, accommodation_id: id, status: "ERROR", error: message },
      { status: 200 }
    );
  }
}
