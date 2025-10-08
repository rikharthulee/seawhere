// Admin/internal shapes (richer). Not imported at runtime.

export interface AdminExcursion extends Record<string, unknown> {
  id: string;
  slug: string;
  name: string;
  summary?: string | null;
  description?: string | null;
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

