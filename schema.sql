-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.accommodation (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  summary text,
  description jsonb,
  address jsonb,
  country_id uuid,
  destination_id uuid,
  lat numeric,
  lng numeric,
  rating numeric,
  price_band USER-DEFINED,
  hero_image text,
  thumbnail_image text,
  images jsonb,
  website_url text,
  affiliate_url text,
  credit text,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::content_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT accommodation_pkey PRIMARY KEY (id),
  CONSTRAINT accommodation_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id),
  CONSTRAINT accommodation_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id)
);
CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body_richtext jsonb,
  cover_image text,
  author_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::content_status,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  destination_id uuid,
  country_id uuid,
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id),
  CONSTRAINT articles_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id),
  CONSTRAINT articles_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'theme'::text CHECK (kind = ANY (ARRAY['theme'::text, 'season'::text, 'interest'::text, 'rail_pass'::text, 'other'::text])),
  description text,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.category_links (
  category_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY['destination'::text, 'poi'::text, 'accommodation'::text, 'article'::text, 'experience'::text, 'tour'::text, 'sight'::text, 'food_drink'::text])),
  entity_id uuid NOT NULL,
  CONSTRAINT category_links_pkey PRIMARY KEY (entity_type, entity_id, category_id),
  CONSTRAINT category_links_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.countries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  iso_code text,
  default_currency text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  summary text,
  hero_image text,
  CONSTRAINT countries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.day_itineraries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description jsonb,
  maps_url text,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::content_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  summary text,
  destination_id uuid,
  country_id uuid,
  slug text UNIQUE,
  cover_image text,
  tags ARRAY DEFAULT '{}'::text[],
  cost_band text CHECK (cost_band = ANY (ARRAY['budget'::text, 'midrange'::text, 'premium'::text, 'luxury'::text])),
  notes text,
  wheelchair_friendly boolean NOT NULL DEFAULT false,
  good_with_kids boolean NOT NULL DEFAULT false,
  CONSTRAINT day_itineraries_pkey PRIMARY KEY (id),
  CONSTRAINT excursions_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id),
  CONSTRAINT excursions_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id)
);
CREATE TABLE public.day_itinerary_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  day_itinerary_id uuid,
  item_type text NOT NULL,
  ref_id uuid,
  sort_order integer DEFAULT 0,
  details text,
  duration_minutes integer,
  maps_url text,
  CONSTRAINT day_itinerary_items_pkey PRIMARY KEY (id),
  CONSTRAINT day_itinerary_items_day_itinerary_id_fkey FOREIGN KEY (day_itinerary_id) REFERENCES public.day_itineraries(id)
);
CREATE TABLE public.day_itinerary_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text,
  details text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT day_itinerary_notes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.day_itinerary_transport_legs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  day_itinerary_id uuid NOT NULL,
  from_item_id uuid NOT NULL,
  to_item_id uuid NOT NULL,
  template_id uuid,
  primary_mode USER-DEFINED NOT NULL,
  title text,
  summary text,
  steps jsonb NOT NULL,
  est_duration_min integer,
  est_distance_m integer,
  est_cost_min numeric,
  est_cost_max numeric,
  currency text DEFAULT 'USD'::text,
  notes text,
  sort_order integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT day_itinerary_transport_legs_pkey PRIMARY KEY (id),
  CONSTRAINT excursion_transport_legs_excursion_id_fkey FOREIGN KEY (day_itinerary_id) REFERENCES public.day_itineraries(id),
  CONSTRAINT excursion_transport_legs_from_item_id_fkey FOREIGN KEY (from_item_id) REFERENCES public.day_itinerary_items(id),
  CONSTRAINT excursion_transport_legs_to_item_id_fkey FOREIGN KEY (to_item_id) REFERENCES public.day_itinerary_items(id),
  CONSTRAINT excursion_transport_legs_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.transport_templates(id)
);
CREATE TABLE public.destination_links (
  from_location_id uuid NOT NULL,
  to_location_id uuid NOT NULL,
  relation text NOT NULL CHECK (relation = ANY (ARRAY['nearby'::text, 'day_trip'::text, 'gateway'::text, 'sister_area'::text])),
  weight integer DEFAULT 0,
  CONSTRAINT destination_links_pkey PRIMARY KEY (from_location_id, relation, to_location_id),
  CONSTRAINT destination_links_from_location_id_fkey FOREIGN KEY (from_location_id) REFERENCES public.destinations(id),
  CONSTRAINT destination_links_to_location_id_fkey FOREIGN KEY (to_location_id) REFERENCES public.destinations(id)
);
CREATE TABLE public.destinations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text,
  body_richtext jsonb,
  credit text,
  lat numeric,
  lng numeric,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::content_status,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  gyg_location_id numeric,
  images jsonb,
  CONSTRAINT destinations_pkey PRIMARY KEY (id),
  CONSTRAINT destinations_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id)
);
CREATE TABLE public.destinations_staging (
  country_slug text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  summary text,
  body_richtext jsonb,
  credit text,
  lat numeric,
  lng numeric,
  status USER-DEFINED DEFAULT 'draft'::content_status,
  published_at timestamp with time zone,
  gyg_location_id numeric,
  images jsonb
);
CREATE TABLE public.exchange_rates (
  currency text NOT NULL,
  units_per_usd numeric NOT NULL CHECK (units_per_usd > 0::numeric),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exchange_rates_pkey PRIMARY KEY (currency)
);
CREATE TABLE public.experience_availability_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL,
  idx integer NOT NULL DEFAULT 0,
  days_of_week ARRAY NOT NULL CHECK (array_length(days_of_week, 1) >= 1 AND days_of_week <@ ARRAY[0::smallint, 1::smallint, 2::smallint, 3::smallint, 4::smallint, 5::smallint, 6::smallint]),
  start_times ARRAY NOT NULL CHECK (array_length(start_times, 1) >= 1),
  valid_from date,
  valid_to date,
  timezone text DEFAULT 'Asia/Bangkok'::text,
  CONSTRAINT experience_availability_rules_pkey PRIMARY KEY (id),
  CONSTRAINT experience_availability_rules_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id)
);
CREATE TABLE public.experience_exceptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL,
  date date NOT NULL,
  action USER-DEFINED NOT NULL,
  start_time time without time zone,
  note text,
  CONSTRAINT experience_exceptions_pkey PRIMARY KEY (id),
  CONSTRAINT experience_exceptions_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id)
);
CREATE TABLE public.experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  destination_id uuid,
  country_id uuid,
  description text,
  summary text,
  body_richtext jsonb,
  images jsonb,
  price jsonb,
  lat numeric,
  lng numeric,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::content_status,
  price_amount numeric,
  price_currency text,
  external_ref_id numeric,
  duration_minutes integer,
  provider text,
  deeplink text,
  tags ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  gyg_id numeric,
  CONSTRAINT experiences_pkey PRIMARY KEY (id),
  CONSTRAINT experiences_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id),
  CONSTRAINT experiences_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id)
);
CREATE TABLE public.food_drink (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  destination_id uuid,
  country_id uuid,
  name text NOT NULL,
  type USER-DEFINED NOT NULL DEFAULT 'restaurant'::food_drink_type,
  address text,
  description jsonb,
  rating numeric,
  images jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  slug text,
  price_band USER-DEFINED,
  tags ARRAY DEFAULT '{}'::text[],
  booking_url text,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::content_status,
  lat numeric,
  lng numeric,
  CONSTRAINT food_drink_pkey PRIMARY KEY (id),
  CONSTRAINT food_drink_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id),
  CONSTRAINT food_drink_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id)
);
CREATE TABLE public.hotels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  destination_id uuid,
  country_id uuid,
  name text NOT NULL,
  address text,
  description text,
  rating numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT hotels_pkey PRIMARY KEY (id),
  CONSTRAINT hotels_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id),
  CONSTRAINT hotels_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id)
);
CREATE TABLE public.itinerary_flights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  itinerary_id uuid,
  flight_number text,
  departure_airport text,
  arrival_airport text,
  departure_time timestamp with time zone,
  arrival_time timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  CONSTRAINT itinerary_flights_pkey PRIMARY KEY (id),
  CONSTRAINT itinerary_flights_itinerary_id_fkey FOREIGN KEY (itinerary_id) REFERENCES public.trips(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'customer'::user_role,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.sight_admission_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sight_id uuid NOT NULL,
  idx integer NOT NULL DEFAULT 0,
  label text NOT NULL,
  min_age integer,
  max_age integer,
  requires_id boolean NOT NULL DEFAULT false,
  amount numeric,
  currency text NOT NULL DEFAULT 'USD'::text,
  is_free boolean NOT NULL DEFAULT false,
  valid_from date,
  valid_to date,
  note text,
  external_url text,
  subsection text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sight_admission_prices_pkey PRIMARY KEY (id),
  CONSTRAINT sight_admission_prices_sight_id_fkey FOREIGN KEY (sight_id) REFERENCES public.sights(id)
);
CREATE TABLE public.sight_opening_exceptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sight_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['closed'::text, 'reduced_hours'::text, 'extended_hours'::text, 'special_event'::text])),
  start_date date,
  end_date date,
  weekday smallint,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sight_opening_exceptions_pkey PRIMARY KEY (id),
  CONSTRAINT sight_opening_exceptions_sight_id_fkey FOREIGN KEY (sight_id) REFERENCES public.sights(id)
);
CREATE TABLE public.sight_opening_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sight_id uuid NOT NULL,
  start_month integer NOT NULL CHECK (start_month >= 1 AND start_month <= 12),
  start_day integer CHECK (start_day >= 1 AND start_day <= 31),
  end_month integer NOT NULL CHECK (end_month >= 1 AND end_month <= 12),
  end_day integer CHECK (end_day >= 1 AND end_day <= 31),
  open_time time without time zone,
  close_time time without time zone,
  last_entry_mins integer NOT NULL DEFAULT 0 CHECK (last_entry_mins >= 0),
  days jsonb,
  is_closed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sight_opening_hours_pkey PRIMARY KEY (id),
  CONSTRAINT sight_opening_hours_sight_id_fkey FOREIGN KEY (sight_id) REFERENCES public.sights(id)
);
CREATE TABLE public.sights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  destination_id uuid,
  country_id uuid,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  slug text UNIQUE,
  summary text,
  body_richtext jsonb,
  lat numeric,
  lng numeric,
  open_hours jsonb,
  images jsonb,
  tags ARRAY DEFAULT '{}'::text[],
  status USER-DEFINED NOT NULL DEFAULT 'draft'::content_status,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  duration_minutes integer,
  provider text,
  deeplink text,
  external_ref_id numeric,
  price_amount numeric,
  price_currency text,
  opening_times_url text,
  maps_place_id text,
  gyg_id numeric,
  CONSTRAINT sights_pkey PRIMARY KEY (id),
  CONSTRAINT sights_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id),
  CONSTRAINT sights_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id)
);
CREATE TABLE public.sights_staging (
  country_slug text,
  destination_slug text,
  name text NOT NULL,
  slug text,
  summary text,
  description text,
  body_richtext jsonb,
  lat numeric,
  lng numeric,
  open_hours jsonb,
  images jsonb,
  tags ARRAY DEFAULT '{}'::text[],
  status USER-DEFINED DEFAULT 'draft'::content_status,
  duration_minutes integer,
  provider text,
  deeplink text,
  external_ref_id numeric,
  price_amount numeric,
  price_currency text,
  opening_times_url text,
  maps_place_id text,
  gyg_id numeric
);
CREATE TABLE public.tour_availability_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL,
  idx integer NOT NULL DEFAULT 0,
  days_of_week ARRAY NOT NULL CHECK (array_length(days_of_week, 1) >= 1 AND days_of_week <@ ARRAY[0::smallint, 1::smallint, 2::smallint, 3::smallint, 4::smallint, 5::smallint, 6::smallint]),
  start_times ARRAY NOT NULL CHECK (array_length(start_times, 1) >= 1),
  valid_from date,
  valid_to date,
  timezone text DEFAULT 'Asia/Bangkok'::text,
  CONSTRAINT tour_availability_rules_pkey PRIMARY KEY (id),
  CONSTRAINT tour_availability_rules_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id)
);
CREATE TABLE public.tour_exceptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL,
  date date NOT NULL,
  action USER-DEFINED NOT NULL,
  start_time time without time zone,
  note text,
  CONSTRAINT tour_exceptions_pkey PRIMARY KEY (id),
  CONSTRAINT tour_exceptions_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id)
);
CREATE TABLE public.tours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  destination_id uuid,
  country_id uuid,
  name text NOT NULL,
  slug text UNIQUE,
  summary text,
  description text,
  body_richtext jsonb,
  images jsonb,
  lat numeric,
  lng numeric,
  duration_minutes integer,
  price_amount numeric,
  price_currency text,
  provider text,
  deeplink text,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::content_status,
  price jsonb,
  external_ref_id numeric,
  tags ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  gyg_id numeric,
  CONSTRAINT tours_pkey PRIMARY KEY (id),
  CONSTRAINT tours_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id),
  CONSTRAINT tours_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id)
);
CREATE TABLE public.transport (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category USER-DEFINED NOT NULL,
  country_id uuid,
  destination_id uuid,
  lat numeric,
  lng numeric,
  google_place_id text,
  slug text UNIQUE,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transport_pkey PRIMARY KEY (id),
  CONSTRAINT transport_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id),
  CONSTRAINT transport_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id)
);
CREATE TABLE public.transport_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  from_transport_id uuid NOT NULL,
  to_transport_id uuid NOT NULL,
  primary_mode USER-DEFINED NOT NULL,
  title text,
  summary text,
  steps jsonb NOT NULL,
  est_duration_min integer,
  est_distance_m integer,
  est_cost_min numeric,
  est_cost_max numeric,
  currency text DEFAULT 'USD'::text,
  tags ARRAY DEFAULT '{}'::text[],
  language text DEFAULT 'en'::text,
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transport_templates_pkey PRIMARY KEY (id),
  CONSTRAINT transport_templates_from_transport_id_fkey FOREIGN KEY (from_transport_id) REFERENCES public.transport(id),
  CONSTRAINT transport_templates_to_transport_id_fkey FOREIGN KEY (to_transport_id) REFERENCES public.transport(id),
  CONSTRAINT transport_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.trip_day_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  day_id uuid,
  item_type text NOT NULL CHECK (item_type = ANY (ARRAY['hotel'::text, 'excursion'::text, 'sight'::text, 'tour'::text, 'food_drink'::text, 'note'::text, 'transport'::text, 'custom'::text])),
  ref_id uuid,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  CONSTRAINT trip_day_items_pkey PRIMARY KEY (id),
  CONSTRAINT trip_day_items_day_id_fkey FOREIGN KEY (day_id) REFERENCES public.trip_days(id)
);
CREATE TABLE public.trip_days (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  trip_id uuid,
  day_index integer NOT NULL,
  title text,
  destination_id uuid,
  sub_destination_id uuid,
  accommodation_id uuid,
  date date,
  created_by uuid DEFAULT auth.uid(),
  day_itinerary_id uuid,
  CONSTRAINT trip_days_pkey PRIMARY KEY (id),
  CONSTRAINT itinerary_days_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id),
  CONSTRAINT itinerary_days_sub_destination_id_fkey FOREIGN KEY (sub_destination_id) REFERENCES public.destinations(id),
  CONSTRAINT itinerary_days_accommodation_id_fkey FOREIGN KEY (accommodation_id) REFERENCES public.accommodation(id),
  CONSTRAINT trip_days_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id),
  CONSTRAINT trip_days_day_itinerary_id_fkey FOREIGN KEY (day_itinerary_id) REFERENCES public.day_itineraries(id)
);
CREATE TABLE public.trips (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  title text,
  summary text,
  destination_id uuid,
  country_id uuid,
  start_date date,
  end_date date,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::itinerary_status,
  visibility USER-DEFINED NOT NULL DEFAULT 'private'::visibility_status,
  notes jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  CONSTRAINT trips_pkey PRIMARY KEY (id),
  CONSTRAINT itineraries_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id),
  CONSTRAINT itineraries_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id),
  CONSTRAINT itineraries_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id)
);
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'customer'::user_role,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.content_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  views_total bigint NOT NULL DEFAULT 0,
  last_viewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT content_views_pkey PRIMARY KEY (id),
  CONSTRAINT content_views_content_unique UNIQUE (content_type, content_id)
);

CREATE INDEX content_views_type_last_viewed_idx
  ON public.content_views (content_type, last_viewed_at DESC);

CREATE INDEX content_views_type_views_idx
  ON public.content_views (content_type, views_total DESC);

CREATE OR REPLACE FUNCTION public.increment_view(type text, id uuid)
RETURNS void
LANGUAGE sql
AS $$
  INSERT INTO public.content_views (content_type, content_id, views_total, last_viewed_at, created_at, updated_at)
  VALUES (type, id, 1, now(), now(), now())
  ON CONFLICT (content_type, content_id)
  DO UPDATE SET
    views_total = public.content_views.views_total + 1,
    last_viewed_at = now(),
    updated_at = now();
$$;

CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hero_headline text,
  hero_tagline text,
  hero_images jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (id)
);
