// Admin/internal shapes (richer). Not imported at runtime.

export interface AdminExcursion extends Record<string, unknown> {
  id: string;
  slug: string;
  name: string;
  summary?: string | null;
  description?: unknown; // string | JSON doc | null
  body_richtext?: unknown;
  images?: unknown;
  destination_id?: string | null;
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
