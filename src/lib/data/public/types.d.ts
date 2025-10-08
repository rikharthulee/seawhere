// Minimal public shapes (SSR-only). Not imported at runtime.

export interface PublicEntity {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  images: unknown;
  opening_times_url: string | null;
  lat: number | null;
  lng: number | null;
}

export interface PublicExcursionItemLink {
  item_type: string; // 'sight' | 'experience' | 'tour' | etc.
  ref_id: string; // UUID of linked entity
  sort_order: number | null;
}

export interface PublicExcursion {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  cover_image: string | null;
  maps_url: string | null;
  destination_id: string | null;
  status: string;
  tags: string[] | null;
  updated_at: string | null;
  transport: unknown;
}

export interface PublicSight {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  body_richtext: unknown;
  images: unknown;
  destination_id: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  duration_minutes: number | null;
  provider: string | null;
  deeplink: string | null;
  gyg_id: string | null;
  price_amount: number | null;
  price_currency: string | null;
  tags: string[] | null;
  opening_times_url: string | null;
}

export interface PublicExperience {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  images: unknown;
  destination_id: string | null;
  status: string;
  provider: string | null;
  price_amount: number | null;
  price_currency: string | null;
  duration_minutes: number | null;
  tags: string[] | null;
}

export interface PublicTour {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  images: unknown;
  destination_id: string | null;
  status: string;
  provider: string | null;
  price_amount: number | null;
  price_currency: string | null;
  duration_minutes: number | null;
  tags: string[] | null;
}
