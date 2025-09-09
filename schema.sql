-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.accommodation (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  summary text,
  description jsonb,
  address jsonb,
  lat numeric,
  lng numeric,
  rating numeric,
  price_band text CHECK (price_band = ANY (ARRAY['$$'::text, '$$$'::text, '$$$$'::text, '$$$$$'::text])),
  hero_image text,
  website_url text,
  affiliate_url text,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
  created_at timestamp with time zone DEFAULT now(),
  credit text,
  images jsonb,
  thumbnail_image text,
  destination_id uuid,
  CONSTRAINT accommodation_pkey PRIMARY KEY (id),
  CONSTRAINT accommodation_destination_id_new_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id)
);
CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body_richtext jsonb,
  cover_image text,
  author_id uuid,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  destination_id uuid,
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT articles_destination_id_new_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id),
  CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  kind text DEFAULT 'theme'::text CHECK (kind = ANY (ARRAY['theme'::text, 'season'::text, 'interest'::text, 'rail_pass'::text])),
  description text,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.category_links (
  category_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY['destination'::text, 'poi'::text, 'accommodation'::text, 'article'::text])),
  entity_id uuid NOT NULL,
  CONSTRAINT category_links_pkey PRIMARY KEY (category_id, entity_type, entity_id),
  CONSTRAINT category_links_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.destination_links (
  from_location_id uuid NOT NULL,
  to_location_id uuid NOT NULL,
  relation text NOT NULL CHECK (relation = ANY (ARRAY['nearby'::text, 'day_trip'::text, 'gateway'::text, 'sister_area'::text])),
  weight integer DEFAULT 0,
  CONSTRAINT destination_links_pkey PRIMARY KEY (from_location_id, to_location_id, relation)
);
CREATE TABLE public.destinations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prefecture_id uuid,
  division_id uuid,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text,
  body_richtext jsonb,
  hero_image text,
  thumbnail_image text,
  credit text,
  lat numeric,
  lng numeric,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT destinations_pkey PRIMARY KEY (id),
  CONSTRAINT destinations_prefecture_id_fkey FOREIGN KEY (prefecture_id) REFERENCES public.prefectures(id),
  CONSTRAINT destinations_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.divisions(id)
);
CREATE TABLE public.divisions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prefecture_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  order_index integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT divisions_pkey PRIMARY KEY (id),
  CONSTRAINT divisions_prefecture_id_fkey FOREIGN KEY (prefecture_id) REFERENCES public.prefectures(id)
);
CREATE TABLE public.itineraries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  title text,
  destination_id uuid,
  start_date date,
  end_date date,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'shared'::text, 'confirmed'::text, 'archived'::text])),
  visibility text DEFAULT 'private'::text CHECK (visibility = ANY (ARRAY['private'::text, 'unlisted'::text, 'public'::text])),
  notes jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT itineraries_pkey PRIMARY KEY (id),
  CONSTRAINT itineraries_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.itinerary_days (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  itinerary_id uuid,
  day_index integer NOT NULL,
  title text,
  destination_id uuid,
  sub_destination_id uuid,
  accommodation_id uuid,
  date date,
  CONSTRAINT itinerary_days_pkey PRIMARY KEY (id),
  CONSTRAINT itinerary_days_sub_destination_fk FOREIGN KEY (sub_destination_id) REFERENCES public.destinations(id),
  CONSTRAINT itinerary_days_accommodation_id_fkey FOREIGN KEY (accommodation_id) REFERENCES public.accommodation(id),
  CONSTRAINT itinerary_days_itinerary_id_fkey FOREIGN KEY (itinerary_id) REFERENCES public.itineraries(id),
  CONSTRAINT itinerary_days_destination_fk FOREIGN KEY (destination_id) REFERENCES public.destinations(id)
);
CREATE TABLE public.itinerary_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  itinerary_day_id uuid,
  position integer NOT NULL,
  kind text NOT NULL CHECK (kind = ANY (ARRAY['poi'::text, 'accommodation'::text, 'note'::text, 'transport'::text, 'meal'::text, 'custom'::text])),
  ref_id uuid,
  start_time time without time zone,
  end_time time without time zone,
  meta jsonb,
  created_at timestamp with time zone DEFAULT now(),
  poi_id uuid,
  accommodation_item_id uuid,
  title_override text,
  CONSTRAINT itinerary_items_pkey PRIMARY KEY (id),
  CONSTRAINT itinerary_items_accommodation_item_id_fkey FOREIGN KEY (accommodation_item_id) REFERENCES public.accommodation(id),
  CONSTRAINT itinerary_items_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.poi(id),
  CONSTRAINT itinerary_items_itinerary_day_id_fkey FOREIGN KEY (itinerary_day_id) REFERENCES public.itinerary_days(id)
);
CREATE TABLE public.poi (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text CHECK (type = ANY (ARRAY['sight'::text, 'food'::text, 'tour'::text, 'experience'::text, 'transport'::text, 'other'::text])),
  title text NOT NULL,
  summary text,
  details jsonb,
  lat numeric,
  lng numeric,
  image text,
  provider text DEFAULT 'internal'::text CHECK (provider = ANY (ARRAY['internal'::text, 'gyg'::text, 'dekitabi'::text])),
  deeplink text,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
  created_at timestamp with time zone DEFAULT now(),
  destination_id uuid,
  timezone text,
  CONSTRAINT poi_pkey PRIMARY KEY (id),
  CONSTRAINT poi_destination_id_new_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id)
);
CREATE TABLE public.poi_opening_exceptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  poi_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  closed boolean NOT NULL DEFAULT true,
  open_time time without time zone,
  close_time time without time zone,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT poi_opening_exceptions_pkey PRIMARY KEY (id),
  CONSTRAINT poi_opening_exceptions_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.poi(id)
);
CREATE TABLE public.poi_opening_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  poi_id uuid NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time time without time zone NOT NULL,
  close_time time without time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT poi_opening_rules_pkey PRIMARY KEY (id),
  CONSTRAINT poi_opening_rules_poi_id_fkey FOREIGN KEY (poi_id) REFERENCES public.poi(id)
);
CREATE TABLE public.prefectures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  region_id uuid,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  lat numeric,
  lng numeric,
  order_index integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prefectures_pkey PRIMARY KEY (id),
  CONSTRAINT prefectures_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text DEFAULT 'customer'::text CHECK (role = ANY (ARRAY['admin'::text, 'editor'::text, 'customer'::text])),
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.regions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  order_index integer,
  created_at timestamp with time zone DEFAULT now(),
  summary text,
  CONSTRAINT regions_pkey PRIMARY KEY (id)
);