import { getDB } from "@/lib/supabase/server";

// Top-level day itinerary list
export async function getPublishedDayItineraries() {
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("day_itineraries")
      .select(
        "id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id, destinations ( slug, name ), cost_band, notes, wheelchair_friendly, good_with_kids"
      )
      .eq("status", "published")
      .order("name", { ascending: true });
    if (error) {
      console.error("getPublishedDayItineraries error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("getPublishedDayItineraries exception:", e);
    return [];
  }
}

// Day itineraries scoped to a destination
export async function getDayItinerariesForDestination(destId) {
  if (!destId) return [];
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("day_itineraries")
      .select(
        "id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id, cost_band, notes, wheelchair_friendly, good_with_kids"
      )
      .eq("destination_id", destId)
      .eq("status", "published")
      .order("name", { ascending: true });
    if (error) {
      console.error("getDayItinerariesForDestination error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("getDayItinerariesForDestination exception:", e);
    return [];
  }
}

// Day itineraries for a set of destination ids (country/destination pages)
export async function getDayItinerariesByDestinationIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("day_itineraries")
      .select(
        "id, slug, name, summary, images, destination_id, deeplink, provider, gyg_id, destinations ( slug, name ), cost_band, notes, wheelchair_friendly, good_with_kids"
      )
      .in("destination_id", ids)
      .eq("status", "published")
      .order("name", { ascending: true });
    if (error) {
      console.error("getDayItinerariesByDestinationIds error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("getDayItinerariesByDestinationIds exception:", e);
    return [];
  }
}

// Single day itinerary by destination slug + template slug
export async function getDayItineraryBySlugs(destinationSlug, dayItinerarySlug) {
  try {
    const db = await getDB();

    const dstSlug = String(destinationSlug || "").trim().toLowerCase();
    const templateSlug = String(dayItinerarySlug || "").trim().toLowerCase();
    if (!dstSlug || !templateSlug) return null;

    const { data: dst, error: dstErr } = await db
      .from("destinations")
      .select("id, slug, name")
      .eq("slug", dstSlug)
      .maybeSingle();

    if (dstErr) {
      console.error(
        "getDayItineraryBySlugs destination lookup error:",
        dstErr.message
      );
      return null;
    }
    if (!dst?.id) return null;

    const { data, error } = await db
      .from("day_itineraries")
      .select(
        "id, slug, name, summary, description, body_richtext, images, destination_id, lat, lng, status, duration_minutes, provider, deeplink, gyg_id, price_amount, price_currency, cost_band, notes, wheelchair_friendly, good_with_kids"
      )
      .eq("destination_id", dst.id)
      .eq("slug", templateSlug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error(
        "getDayItineraryBySlugs template lookup error:",
        error.message
      );
      return null;
    }
    if (!data) return null;

    return { dayItinerary: data, destination: dst };
  } catch (e) {
    console.error("getDayItineraryBySlugs exception:", e);
    return null;
  }
}

// Optional: opening hours/exception helpers if tracked for day itineraries
export async function getDayItineraryOpeningHours(id) {
  if (!id) return [];
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("day_itinerary_opening_hours")
      .select(
        "weekday, idx, open_time, close_time, is_closed, valid_from, valid_to"
      )
      .eq("day_itinerary_id", id)
      .order("weekday", { ascending: true })
      .order("idx", { ascending: true });
    if (error) {
      console.error("getDayItineraryOpeningHours error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("getDayItineraryOpeningHours exception:", e);
    return [];
  }
}

export async function getDayItineraryOpeningExceptions(id) {
  if (!id) return [];
  try {
    const db = await getDB();
    const { data, error } = await db
      .from("day_itinerary_opening_exceptions")
      .select("date, is_closed, open_time, close_time, note")
      .eq("day_itinerary_id", id)
      .order("date", { ascending: true });
    if (error) {
      console.error("getDayItineraryOpeningExceptions error:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("getDayItineraryOpeningExceptions exception:", e);
    return [];
  }
}

// -----------------------------
// Public curated day itinerary loader (strict, no fallbacks)
// -----------------------------

const PUBLIC_ENTITY_COLUMNS =
  "id,slug,name,summary,images,opening_times_url,lat,lng";

// Note: Public helpers live in src/lib/data/public/itineraries.js.
// This module is for admin/internal helpers only.
