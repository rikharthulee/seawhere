import { getDB } from "@/lib/supabase/server";

// Top-level excursions list
export async function getPublishedExcursions() {
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("excursions")
      .select(
        "id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id, destinations ( slug, name ), cost_band, notes, wheelchair_friendly, good_with_kids"
      )
      .eq("status", "published")
      .order("name", { ascending: true });
    if (error) {
      console.error("getPublishedExcursions error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("getPublishedExcursions exception:", e);
    return [];
  }
}

// Excursions scoped to a destination
export async function getExcursionsForDestination(destId) {
  if (!destId) return [];
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("excursions")
      .select(
        "id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id, cost_band, notes, wheelchair_friendly, good_with_kids"
      )
      .eq("destination_id", destId)
      .eq("status", "published")
      .order("name", { ascending: true });
    if (error) {
      console.error("getExcursionsForDestination error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("getExcursionsForDestination exception:", e);
    return [];
  }
}

// Excursions for a set of destination ids (region/prefecture/division pages)
export async function getExcursionsByDestinationIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("excursions")
      .select(
        "id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id, destinations ( slug, name ), cost_band, notes, wheelchair_friendly, good_with_kids"
      )
      .in("destination_id", ids)
      .eq("status", "published")
      .order("name", { ascending: true });
    if (error) {
      console.error("getExcursionsByDestinationIds error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("getExcursionsByDestinationIds exception:", e);
    return [];
  }
}

// Single excursion by destination slug + excursion slug
export async function getExcursionBySlugs(destinationSlug, excursionSlug) {
  try {
    const db = await getDB();

    const dstSlug = String(destinationSlug || "")
      .trim()
      .toLowerCase();
    const excSlug = String(excursionSlug || "")
      .trim()
      .toLowerCase();
    if (!dstSlug || !excSlug) return null;

    const { data: dst, error: dstErr } = await db
      .from("destinations")
      .select("id, slug, name")
      .eq("slug", dstSlug)
      .maybeSingle();

    if (dstErr) {
      console.error(
        "getExcursionBySlugs destination lookup error:",
        dstErr.message
      );
      return null;
    }
    if (!dst?.id) return null;

    const { data, error } = await db
      .from("excursions")
      .select(
        "id, slug, name, summary, description, body_richtext, images, destination_id, lat, lng, status, duration_minutes, provider, deeplink, gyg_id, price_amount, price_currency, cost_band, notes, wheelchair_friendly, good_with_kids"
      )
      .eq("destination_id", dst.id)
      .eq("slug", excSlug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error(
        "getExcursionBySlugs excursion lookup error:",
        error.message
      );
      return null;
    }
    if (!data) return null;

    return { excursion: data, destination: dst };
  } catch (e) {
    console.error("getExcursionBySlugs exception:", e);
    return null;
  }
}

// Optional: opening hours/exception helpers if tracked for excursions
export async function getExcursionOpeningHours(id) {
  if (!id) return [];
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("excursion_opening_hours")
      .select(
        "weekday, idx, open_time, close_time, is_closed, valid_from, valid_to"
      )
      .eq("excursion_id", id)
      .order("weekday", { ascending: true })
      .order("idx", { ascending: true });
    if (error) {
      console.error("getExcursionOpeningHours error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("getExcursionOpeningHours exception:", e);
    return [];
  }
}

export async function getExcursionOpeningExceptions(id) {
  if (!id) return [];
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("excursion_opening_exceptions")
      .select("date, is_closed, open_time, close_time, note")
      .eq("excursion_id", id)
      .order("date", { ascending: true });
    if (error) {
      console.error("getExcursionOpeningExceptions error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("getExcursionOpeningExceptions exception:", e);
    return [];
  }
}

// -----------------------------
// Public curated excursion loader (strict, no fallbacks)
// -----------------------------

const PUBLIC_ENTITY_COLUMNS =
  "id,slug,name,summary,images,opening_times_url,lat,lng";

// Note: Public helpers live in src/lib/data/public/excursions.js.
// This module is for admin/internal helpers only.
