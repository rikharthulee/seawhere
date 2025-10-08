// Public select columns for SSR-only helpers (anon-safe)
// Keep these minimal and reusable across features.

// Generic entity columns commonly used across entity types
export const ENTITY_PUBLIC_COLUMNS =
  'id,slug,name,summary,images,opening_times_url,lat,lng';

// Excursions
export const EXCURSION_PUBLIC_COLUMNS =
  'id,slug,name,summary,description,cover_image,maps_url,destination_id,status,tags,updated_at,transport';

// Link-table minimal shape for curated items
export const EXCURSION_LINK_COLUMNS = 'item_type,ref_id,sort_order';

