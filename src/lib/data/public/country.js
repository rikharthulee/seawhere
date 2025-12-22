import { getPublicDB } from "@/lib/supabase/public";
import {
  SIGHT_PUBLIC_COLUMNS,
  EXPERIENCE_PUBLIC_COLUMNS,
  TOUR_PUBLIC_COLUMNS,
} from "@/lib/data/public/selects";

const BASE_LIMIT = 6;

export async function fetchCountryHighlights(countryId) {
  if (!countryId) return { destinations: [], sights: [], experiences: [], food: [], accommodation: [], tours: [] };
  const db = getPublicDB();
  const [destinationsRes, sightsRes, experiencesRes, foodRes, accommodationRes, toursRes] =
    await Promise.all([
      db
        .from("destinations")
        .select("id, name, slug, summary, images, country_id, countries ( slug )")
        .eq("country_id", countryId)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(BASE_LIMIT),
      db
        .from("sights")
        .select(`${SIGHT_PUBLIC_COLUMNS}`)
        .eq("country_id", countryId)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(BASE_LIMIT),
      db
        .from("experiences")
        .select(`${EXPERIENCE_PUBLIC_COLUMNS}`)
        .eq("country_id", countryId)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(BASE_LIMIT),
      db
        .from("food_drink")
        .select("id, slug, name, description, images, status, type, price_band, rating, booking_url, address, destination_id, country_id")
        .eq("country_id", countryId)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(BASE_LIMIT),
      db
        .from("accommodation")
        .select("id, slug, name, summary, description, images, status, price_band, rating, affiliate_url, destination_id, country_id")
        .eq("country_id", countryId)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(BASE_LIMIT),
      db
        .from("tours")
        .select(`${TOUR_PUBLIC_COLUMNS}`)
        .eq("country_id", countryId)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(BASE_LIMIT),
    ]);

  return {
    destinations: destinationsRes.data || [],
    sights: sightsRes.data || [],
    experiences: experiencesRes.data || [],
    food: foodRes.data || [],
    accommodation: accommodationRes.data || [],
    tours: toursRes.data || [],
  };
}

export async function fetchFeaturedCountries(limit = 6) {
  const db = getPublicDB();
  const { data } = await db
    .from("countries")
    .select("id, name, slug, summary, hero_image, iso_code")
    .order("name", { ascending: true })
    .limit(limit);
  return data || [];
}

export async function fetchPopularContent(limitPerType = 4) {
  const db = getPublicDB();
  const [destinationsRes, sightsRes, experiencesRes, foodRes, accommodationRes, toursRes] =
    await Promise.all([
      db
        .from("destinations")
        .select("id, slug, name, summary, images, country_id, countries ( slug )")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limitPerType),
      db
        .from("sights")
        .select(`${SIGHT_PUBLIC_COLUMNS}`)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(limitPerType),
      db
        .from("experiences")
        .select(`${EXPERIENCE_PUBLIC_COLUMNS}`)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(limitPerType),
      db
        .from("food_drink")
        .select("id, slug, name, description, images, status, type, price_band, rating, booking_url, address, destination_id, country_id")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(limitPerType),
      db
        .from("accommodation")
        .select("id, slug, name, summary, description, images, status, price_band, rating, affiliate_url, destination_id, country_id")
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(limitPerType),
      db
        .from("tours")
        .select(`${TOUR_PUBLIC_COLUMNS}`)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(limitPerType),
    ]);

  return {
    destinations: destinationsRes.data || [],
    sights: sightsRes.data || [],
    experiences: experiencesRes.data || [],
    food: foodRes.data || [],
    accommodation: accommodationRes.data || [],
    tours: toursRes.data || [],
  };
}
