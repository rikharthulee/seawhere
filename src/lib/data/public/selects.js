// Public select columns for SSR-only helpers (anon-safe)
// Keep these minimal and reusable across features.

// Generic entity columns commonly used across entity types
export const ENTITY_PUBLIC_COLUMNS =
  "id,slug,name,summary,images,opening_times_url,lat,lng";

// Day Itineraries (templates)
export const DAY_ITINERARY_PUBLIC_COLUMNS =
  "id,slug,name,summary,description,cover_image,maps_url,destination_id,country_id,status,tags,updated_at,cost_band,notes,wheelchair_friendly,good_with_kids";

// Link-table minimal shape for curated items
export const DAY_ITINERARY_LINK_COLUMNS = "id,item_type,ref_id,sort_order,details,duration_minutes,maps_url";

// Notes
export const NOTE_PUBLIC_COLUMNS = "id,title,details";

// Sights
export const SIGHT_PUBLIC_COLUMNS =
  "id,slug,name,summary,description,body_richtext,images,destination_id,country_id,lat,lng,status,duration_minutes,provider,deeplink,gyg_id,price_amount,price_currency,tags,opening_times_url";

// Experiences
export const EXPERIENCE_PUBLIC_COLUMNS =
  "id,slug,name,summary,description,body_richtext,images,destination_id,country_id,status,provider,price_amount,price_currency,duration_minutes,tags";

// Tours
export const TOUR_PUBLIC_COLUMNS =
  "id,slug,name,summary,description,body_richtext,images,destination_id,country_id,status,provider,price_amount,price_currency,duration_minutes,tags";
