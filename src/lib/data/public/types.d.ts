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

