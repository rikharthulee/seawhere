// Admin/internal shapes (richer). Not imported at runtime.

export interface Country extends Record<string, unknown> {
  id: string;
  name: string;
  slug: string;
  iso_code?: string | null;
  default_currency?: string | null;
}

export interface Destination extends Record<string, unknown> {
  id: string;
  slug: string;
  name: string;
  summary?: string | null;
  body_richtext?: unknown;
  images?: unknown;
  credit?: string | null;
  status?: string;
  country_id: string;
  lat?: number | null;
  lng?: number | null;
  gyg_location_id?: string | number | null;
}

export interface AdminExcursion extends Record<string, unknown> {
  id: string;
  slug: string;
  name: string;
  summary?: string | null;
  description?: unknown; // string | JSON doc | null
  body_richtext?: unknown;
  images?: unknown;
  destination_id?: string | null;
  country_id?: string | null;
  lat?: number | null;
  lng?: number | null;
  status?: string;
  duration_minutes?: number | null;
  provider?: string | null;
  deeplink?: string | null;
  gyg_id?: string | null;
  price_amount?: number | null;
  price_currency?: string | null;
}

export interface AdminSight extends Record<string, unknown> {
  id: string;
  slug: string;
  country_id?: string | null;
  destination_id?: string | null;
  name: string;
  summary?: string | null;
  description?: unknown; // string | JSON doc | null
  body_richtext?: unknown;
  lat?: number | null;
  lng?: number | null;
  status?: string;
  duration_minutes?: number | null;
  provider?: string | null;
  deeplink?: string | null;
  gyg_id?: string | null;
  price_amount?: number | null;
  price_currency?: string | null;
  tags?: string[] | null;
  opening_times_url?: string | null;
}

export interface AdminExperience extends Record<string, unknown> {
  id: string;
  slug: string;
  country_id?: string | null;
  destination_id?: string | null;
  name: string;
  summary?: string | null;
  description?: unknown; // string | JSON doc | null
  images?: unknown;
  status?: string;
  provider?: string | null;
  price_amount?: number | null;
  price_currency?: string | null;
  duration_minutes?: number | null;
  tags?: string[] | null;
}

export interface AdminTour extends Record<string, unknown> {
  id: string;
  slug: string;
  country_id?: string | null;
  destination_id?: string | null;
  name: string;
  summary?: string | null;
  description?: unknown; // string | JSON doc | null
  images?: unknown;
  status?: string;
  provider?: string | null;
  price_amount?: number | null;
  price_currency?: string | null;
  duration_minutes?: number | null;
  tags?: string[] | null;
}
