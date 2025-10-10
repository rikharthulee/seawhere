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

export interface PublicExcursionTransportLeg {
  id: string;
  primary_mode: string | null;
  title: string | null;
  summary: string | null;
  steps: unknown[];
  est_duration_min: number | null;
  est_distance_m: number | null;
  est_cost_min: number | null;
  est_cost_max: number | null;
  currency: string | null;
  notes: string | null;
  maps_url: string | null;
  sort_order: number | null;
}

export interface PublicExcursion {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: unknown; // string | JSON doc | null
  cover_image: string | null;
  maps_url: string | null;
  destination_id: string | null;
  status: string;
  tags: string[] | null;
  updated_at: string | null;
  cost_band: string | null;
  notes: string | null;
  wheelchair_friendly: boolean | null;
  good_with_kids: boolean | null;
  transport: PublicExcursionTransportLeg[];
}

export interface PublicSight {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: unknown; // string | JSON doc | null
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
  description: unknown; // string | JSON doc | null
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
  description: unknown; // string | JSON doc | null
  images: unknown;
  destination_id: string | null;
  status: string;
  provider: string | null;
  price_amount: number | null;
  price_currency: string | null;
  duration_minutes: number | null;
  tags: string[] | null;
}
