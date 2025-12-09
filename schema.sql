-- SEAWHERE SCHEMA v1
-- Fresh schema for Southeast Asia travel app
-- Designed for Supabase/Postgres
-- Assumes pgcrypto/uuid is available (Supabase default)

------------------------------------------------------------
-- ENUM TYPES
------------------------------------------------------------

CREATE TYPE public.content_status AS ENUM ('draft', 'published');
CREATE TYPE public.itinerary_status AS ENUM ('draft', 'shared', 'confirmed', 'archived');
CREATE TYPE public.visibility_status AS ENUM ('private', 'unlisted', 'public');
CREATE TYPE public.food_drink_type AS ENUM ('restaurant', 'bar', 'cafe', 'other');
CREATE TYPE public.transport_category AS ENUM (
  'station', 'bus_stop', 'bus_terminal', 'ferry_pier', 'airport', 'entrance', 'other'
);
CREATE TYPE public.transport_mode AS ENUM (
  'WALK', 'TRAIN', 'METRO', 'BUS', 'TRAM', 'TAXI', 'DRIVE', 'FERRY', 'FLY', 'OTHER'
);
CREATE TYPE public.user_role AS ENUM ('admin', 'editor', 'customer');
CREATE TYPE public.exception_action AS ENUM ('cancel', 'add', 'modify');
CREATE TYPE public.price_band AS ENUM ('$', '$$', '$$$', '$$$$', '$$$$$');

------------------------------------------------------------
-- CORE GEO TABLES
------------------------------------------------------------

CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  iso_code text,                 -- e.g. TH, LA, VN, KH
  default_currency text,         -- e.g. THB, LAK, USD
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.countries(id),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text,
  body_richtext jsonb,
  credit text,
  lat numeric,
  lng numeric,
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  gyg_location_id numeric,
  images jsonb
);

-- Optional relationships between destinations
CREATE TABLE public.destination_links (
  from_location_id uuid NOT NULL REFERENCES public.destinations(id),
  to_location_id uuid NOT NULL REFERENCES public.destinations(id),
  relation text NOT NULL CHECK (relation = ANY (
    ARRAY['nearby', 'day_trip', 'gateway', 'sister_area']
  )),
  weight integer DEFAULT 0,
  PRIMARY KEY (from_location_id, relation, to_location_id)
);

------------------------------------------------------------
-- USERS & ROLES
------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  role public.user_role NOT NULL DEFAULT 'customer',
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.user_roles (
  user_id uuid PRIMARY KEY,
  role public.user_role NOT NULL DEFAULT 'customer',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

------------------------------------------------------------
-- CATEGORIES & TAGGING
------------------------------------------------------------

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'theme' CHECK (
    kind = ANY (ARRAY['theme', 'season', 'interest', 'rail_pass', 'other'])
  ),
  description text
);

CREATE TABLE public.category_links (
  category_id uuid NOT NULL REFERENCES public.categories(id),
  entity_type text NOT NULL CHECK (entity_type = ANY (
    ARRAY['destination', 'poi', 'accommodation', 'article', 'experience', 'tour', 'sight', 'food_drink']
  )),
  entity_id uuid NOT NULL,
  PRIMARY KEY (entity_type, entity_id, category_id)
);

------------------------------------------------------------
-- ACCOMMODATION / HOTELS / FOOD & DRINK
------------------------------------------------------------

CREATE TABLE public.accommodation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  summary text,
  description jsonb,
  address jsonb,
  country_id uuid REFERENCES public.countries(id),
  destination_id uuid REFERENCES public.destinations(id),
  lat numeric,
  lng numeric,
  rating numeric,
  price_band public.price_band,
  hero_image text,
  thumbnail_image text,
  images jsonb,
  website_url text,
  affiliate_url text,
  credit text,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.food_drink (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid REFERENCES public.destinations(id),
  country_id uuid REFERENCES public.countries(id),
  name text NOT NULL,
  type public.food_drink_type NOT NULL DEFAULT 'restaurant',
  address text,
  description jsonb,
  rating numeric,
  images jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  slug text,
  price_band public.price_band,
  tags text[] DEFAULT '{}'::text[],
  booking_url text,
  status public.content_status NOT NULL DEFAULT 'draft'
);

-- Optional "legacy/simple" hotels table if you still use it somewhere
CREATE TABLE public.hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid REFERENCES public.destinations(id),
  country_id uuid REFERENCES public.countries(id),
  name text NOT NULL,
  address text,
  description text,
  rating numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- SIGHTS / POI / TOURS / EXPERIENCES
------------------------------------------------------------

CREATE TABLE public.sights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid REFERENCES public.destinations(id),
  country_id uuid REFERENCES public.countries(id),
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  slug text UNIQUE,
  summary text,
  body_richtext jsonb,
  lat numeric,
  lng numeric,
  open_hours jsonb,
  images jsonb,
  tags text[] DEFAULT '{}'::text[],
  status public.content_status NOT NULL DEFAULT 'draft',
  updated_at timestamptz NOT NULL DEFAULT now(),
  duration_minutes integer,
  provider text,
  deeplink text,
  external_ref_id numeric,       -- generic marketplace / GYG-like id
  price_amount numeric,
  price_currency text,           -- e.g. THB, LAK, USD
  opening_times_url text,
  maps_place_id text
);

CREATE TABLE public.sight_admission_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sight_id uuid NOT NULL REFERENCES public.sights(id),
  idx integer NOT NULL DEFAULT 0,
  label text NOT NULL,
  min_age integer,
  max_age integer,
  requires_id boolean NOT NULL DEFAULT false,
  amount numeric,
  currency text NOT NULL DEFAULT 'USD',
  is_free boolean NOT NULL DEFAULT false,
  valid_from date,
  valid_to date,
  note text,
  external_url text,
  subsection text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sight_opening_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sight_id uuid NOT NULL REFERENCES public.sights(id),
  start_month integer NOT NULL CHECK (start_month BETWEEN 1 AND 12),
  start_day integer CHECK (start_day BETWEEN 1 AND 31),
  end_month integer NOT NULL CHECK (end_month BETWEEN 1 AND 12),
  end_day integer CHECK (end_day BETWEEN 1 AND 31),
  open_time time,
  close_time time,
  last_entry_mins integer NOT NULL DEFAULT 0 CHECK (last_entry_mins >= 0),
  days jsonb,                    -- e.g. { "mon": true, "tue": false, ... }
  is_closed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sight_opening_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sight_id uuid NOT NULL REFERENCES public.sights(id),
  type text NOT NULL CHECK (type = ANY (ARRAY['closed', 'reduced_hours', 'extended_hours', 'special_event'])),
  start_date date,
  end_date date,
  weekday smallint,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Experiences: 3rd-party products, APIs, etc.
CREATE TABLE public.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  destination_id uuid REFERENCES public.destinations(id),
  country_id uuid REFERENCES public.countries(id),
  description text,
  summary text,
  body_richtext jsonb,
  images jsonb,
  price jsonb,                   -- flexible multi-currency structure
  lat numeric,
  lng numeric,
  status public.content_status NOT NULL DEFAULT 'draft',
  price_amount numeric,
  price_currency text,
  external_ref_id numeric,
  duration_minutes integer,
  provider text,
  deeplink text,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.experience_availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id),
  idx integer NOT NULL DEFAULT 0,
  days_of_week smallint[] NOT NULL CHECK (
    array_length(days_of_week, 1) >= 1
    AND days_of_week <@ ARRAY[0,1,2,3,4,5,6]::smallint[]
  ),
  start_times time[] NOT NULL CHECK (array_length(start_times, 1) >= 1),
  valid_from date,
  valid_to date,
  timezone text DEFAULT 'Asia/Bangkok'
);

CREATE TABLE public.experience_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id),
  date date NOT NULL,
  action public.exception_action NOT NULL,
  start_time time,
  note text
);

-- Tours: your own curated/bookable in-house tours
CREATE TABLE public.tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid REFERENCES public.destinations(id),
  country_id uuid REFERENCES public.countries(id),
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
  status public.content_status NOT NULL DEFAULT 'draft',
  price jsonb,
  external_ref_id numeric,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tour_availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.tours(id),
  idx integer NOT NULL DEFAULT 0,
  days_of_week smallint[] NOT NULL CHECK (
    array_length(days_of_week, 1) >= 1
    AND days_of_week <@ ARRAY[0,1,2,3,4,5,6]::smallint[]
  ),
  start_times time[] NOT NULL CHECK (array_length(start_times, 1) >= 1),
  valid_from date,
  valid_to date,
  timezone text DEFAULT 'Asia/Bangkok'
);

CREATE TABLE public.tour_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.tours(id),
  date date NOT NULL,
  action public.exception_action NOT NULL,
  start_time time,
  note text
);
------------------------------------------------------------
-- TRANSPORT NODES & TEMPLATES
------------------------------------------------------------

CREATE TABLE public.transport (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category public.transport_category NOT NULL,
  country_id uuid REFERENCES public.countries(id),
  destination_id uuid REFERENCES public.destinations(id),
  lat numeric,
  lng numeric,
  google_place_id text,
  slug text UNIQUE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.transport_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_transport_id uuid NOT NULL REFERENCES public.transport(id),
  to_transport_id uuid NOT NULL REFERENCES public.transport(id),
  primary_mode public.transport_mode NOT NULL,
  title text,
  summary text,
  steps jsonb NOT NULL,
  est_duration_min integer,
  est_distance_m integer,
  est_cost_min numeric,
  est_cost_max numeric,
  currency text DEFAULT 'USD',
  tags text[] DEFAULT '{}'::text[],
  language text DEFAULT 'en',
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- EXCURSIONS (CUSTOM MULTI-STOP FLOWS)
------------------------------------------------------------

CREATE TABLE public.excursions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description jsonb,
  maps_url text,
  status public.content_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz,
  summary text,
  destination_id uuid REFERENCES public.destinations(id),
  country_id uuid REFERENCES public.countries(id),
  slug text UNIQUE,
  cover_image text,
  tags text[] DEFAULT '{}'::text[],
  cost_band text CHECK (cost_band = ANY (ARRAY['budget', 'midrange', 'premium', 'luxury'])),
  notes text,
  wheelchair_friendly boolean NOT NULL DEFAULT false,
  good_with_kids boolean NOT NULL DEFAULT false
);

CREATE TABLE public.excursion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  excursion_id uuid REFERENCES public.excursions(id),
  item_type text NOT NULL,       -- e.g. 'sight','food_drink','experience','note','custom'
  ref_id uuid,
  sort_order integer DEFAULT 0,
  details text,
  duration_minutes integer,
  maps_url text
);

CREATE TABLE public.excursion_transport_legs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  excursion_id uuid NOT NULL REFERENCES public.excursions(id),
  from_item_id uuid NOT NULL REFERENCES public.excursion_items(id),
  to_item_id uuid NOT NULL REFERENCES public.excursion_items(id),
  template_id uuid REFERENCES public.transport_templates(id),
  primary_mode public.transport_mode NOT NULL,
  title text,
  summary text,
  steps jsonb NOT NULL,          -- structured directions
  est_duration_min integer,
  est_distance_m integer,
  est_cost_min numeric,
  est_cost_max numeric,
  currency text DEFAULT 'USD',
  notes text,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.excursion_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  details text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

------------------------------------------------------------
-- ITINERARIES
------------------------------------------------------------

CREATE TABLE public.itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id),
  title text,
  destination_id uuid REFERENCES public.destinations(id),
  country_id uuid REFERENCES public.countries(id),
  start_date date,
  end_date date,
  status public.itinerary_status NOT NULL DEFAULT 'draft',
  visibility public.visibility_status NOT NULL DEFAULT 'private',
  notes jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid()
);

CREATE TABLE public.itinerary_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid REFERENCES public.itineraries(id),
  day_index integer NOT NULL,            -- 0-based or 1-based, up to you
  title text,
  destination_id uuid REFERENCES public.destinations(id),
  sub_destination_id uuid REFERENCES public.destinations(id),
  accommodation_id uuid REFERENCES public.accommodation(id),
  date date,
  created_by uuid DEFAULT auth.uid()
);

CREATE TABLE public.itinerary_day_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid REFERENCES public.itinerary_days(id),
  item_type text NOT NULL CHECK (item_type = ANY (
    ARRAY['hotel', 'excursion', 'sight', 'tour', 'food_drink', 'note', 'transport', 'custom']
  )),
  ref_id uuid,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid()
);

CREATE TABLE public.itinerary_flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid REFERENCES public.itineraries(id),
  flight_number text,
  departure_airport text,
  arrival_airport text,
  departure_time timestamptz,
  arrival_time timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid()
);

------------------------------------------------------------
-- ARTICLES & CONTENT
------------------------------------------------------------

CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body_richtext jsonb,
  cover_image text,
  author_id uuid REFERENCES public.profiles(id),
  status public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  destination_id uuid REFERENCES public.destinations(id),
  country_id uuid REFERENCES public.countries(id)
);

------------------------------------------------------------
-- EXCHANGE RATES (OPTIONAL BUT HANDY)
------------------------------------------------------------

CREATE TABLE public.exchange_rates (
  currency text PRIMARY KEY,     -- e.g. THB, LAK, USD, GBP
  units_per_usd numeric NOT NULL CHECK (units_per_usd > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);