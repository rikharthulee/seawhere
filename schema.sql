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
  prefecture_id uuid,
  division_id uuid,
  destination_id uuid,
  CONSTRAINT accommodation_pkey PRIMARY KEY (id),
  CONSTRAINT accommodation_prefecture_id_fkey FOREIGN KEY (prefecture_id) REFERENCES public.prefectures(id),
  CONSTRAINT accommodation_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.divisions(id),
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
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  destination_id uuid,
  CONSTRAINT articles_pkey PRIMARY KEY (id),
  CONSTRAINT articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id),
  CONSTRAINT articles_destination_id_new_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id)
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
  gyg_location_id numeric,
  images jsonb,
  CONSTRAINT destinations_pkey PRIMARY KEY (id),
  CONSTRAINT destinations_division_id_fkey FOREIGN KEY (division_id) REFERENCES public.divisions(id),
  CONSTRAINT destinations_prefecture_id_fkey FOREIGN KEY (prefecture_id) REFERENCES public.prefectures(id)
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
CREATE TABLE public.exchange_rates (
  currency text NOT NULL,
  jpy_per_unit numeric NOT NULL CHECK (jpy_per_unit > 0::numeric),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT exchange_rates_pkey PRIMARY KEY (currency)
);
CREATE TABLE public.excursion_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  excursion_id uuid,
  title text NOT NULL,
  body text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT excursion_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT excursion_blocks_excursion_id_fkey FOREIGN KEY (excursion_id) REFERENCES public.excursion_templates(id)
);
CREATE TABLE public.excursion_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  destination_id uuid,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT excursion_templates_pkey PRIMARY KEY (id),
  CONSTRAINT excursion_templates_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id)
);
CREATE TABLE public.experience_availability_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL,
  idx integer NOT NULL DEFAULT 0,
  days_of_week ARRAY NOT NULL CHECK (array_length(days_of_week, 1) >= 1 AND days_of_week <@ ARRAY[0, 1, 2, 3, 4, 5, 6]),
  start_times ARRAY NOT NULL CHECK (array_length(start_times, 1) >= 1),
  valid_from date,
  valid_to date,
  timezone text DEFAULT 'Asia/Tokyo'::text,
  CONSTRAINT experience_availability_rules_pkey PRIMARY KEY (id),
  CONSTRAINT experience_availability_rules_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id)
);
CREATE TABLE public.experience_exceptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL,
  date date NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['cancel'::text, 'add'::text, 'modify'::text])),
  start_time time without time zone,
  note text,
  CONSTRAINT experience_exceptions_pkey PRIMARY KEY (id),
  CONSTRAINT experience_exceptions_experience_id_fkey FOREIGN KEY (experience_id) REFERENCES public.experiences(id)
);
CREATE TABLE public.experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  destination_id uuid,
  description text,
  summary text,
  body_richtext jsonb,
  images jsonb,
  price jsonb,
  lat numeric,
  lng numeric,
  status text,
  price_jpy numeric,
  price_gbp numeric,
  price_usd numeric,
  CONSTRAINT experiences_pkey PRIMARY KEY (id),
  CONSTRAINT experiences_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id)
);
CREATE TABLE public.food_drink (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  destination_id uuid,
  name text NOT NULL,
  type text DEFAULT 'restaurant'::text CHECK (type = ANY (ARRAY['restaurant'::text, 'bar'::text, 'cafe'::text, 'other'::text])),
  address text,
  description text,
  rating numeric,
  images jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT food_drink_pkey PRIMARY KEY (id),
  CONSTRAINT food_drink_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id)
);
CREATE TABLE public.hotels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  destination_id uuid,
  name text NOT NULL,
  address text,
  description text,
  rating numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hotels_pkey PRIMARY KEY (id),
  CONSTRAINT hotels_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id)
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
  created_by uuid DEFAULT auth.uid(),
  CONSTRAINT itineraries_pkey PRIMARY KEY (id),
  CONSTRAINT itineraries_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.itinerary_day_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  day_id uuid,
  item_type text NOT NULL CHECK (item_type = ANY (ARRAY['hotel'::text, 'excursion'::text, 'sight'::text, 'tour'::text, 'food_drink'::text])),
  ref_id uuid NOT NULL,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  CONSTRAINT itinerary_day_items_pkey PRIMARY KEY (id),
  CONSTRAINT itinerary_day_items_day_id_fkey FOREIGN KEY (day_id) REFERENCES public.itinerary_days(id)
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
  created_by uuid DEFAULT auth.uid(),
  CONSTRAINT itinerary_days_pkey PRIMARY KEY (id),
  CONSTRAINT itinerary_days_sub_destination_fk FOREIGN KEY (sub_destination_id) REFERENCES public.destinations(id),
  CONSTRAINT itinerary_days_destination_fk FOREIGN KEY (destination_id) REFERENCES public.destinations(id),
  CONSTRAINT itinerary_days_itinerary_id_fkey FOREIGN KEY (itinerary_id) REFERENCES public.itineraries(id),
  CONSTRAINT itinerary_days_accommodation_id_fkey FOREIGN KEY (accommodation_id) REFERENCES public.accommodation(id)
);
CREATE TABLE public.itinerary_flights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  itinerary_id uuid,
  flight_number text,
  departure_airport text,
  arrival_airport text,
  departure_time timestamp with time zone,
  arrival_time timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  CONSTRAINT itinerary_flights_pkey PRIMARY KEY (id),
  CONSTRAINT itinerary_flights_itinerary_id_fkey FOREIGN KEY (itinerary_id) REFERENCES public.itineraries(id)
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
  accommodation_item_id uuid,
  title_override text,
  CONSTRAINT itinerary_items_pkey PRIMARY KEY (id),
  CONSTRAINT itinerary_items_itinerary_day_id_fkey FOREIGN KEY (itinerary_day_id) REFERENCES public.itinerary_days(id),
  CONSTRAINT itinerary_items_accommodation_item_id_fkey FOREIGN KEY (accommodation_item_id) REFERENCES public.accommodation(id)
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
CREATE TABLE public.product_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  item_type text NOT NULL CHECK (item_type = ANY (ARRAY['sight'::text, 'tour'::text, 'experience'::text, 'food_drink'::text, 'hotel'::text])),
  ref_id uuid NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT product_items_pkey PRIMARY KEY (id),
  CONSTRAINT product_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  destination_id uuid NOT NULL,
  slug text UNIQUE,
  name text NOT NULL,
  summary text,
  body_richtext jsonb,
  images jsonb,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id)
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
CREATE TABLE public.sight_opening_exceptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sight_id uuid NOT NULL,
  date date NOT NULL,
  is_closed boolean NOT NULL DEFAULT false,
  open_time time without time zone,
  close_time time without time zone,
  note text,
  CONSTRAINT sight_opening_exceptions_pkey PRIMARY KEY (id),
  CONSTRAINT sight_opening_exceptions_sight_id_fkey FOREIGN KEY (sight_id) REFERENCES public.sights(id)
);
CREATE TABLE public.sight_opening_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sight_id uuid NOT NULL,
  weekday integer NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  idx integer NOT NULL DEFAULT 0,
  open_time time without time zone,
  close_time time without time zone,
  is_closed boolean NOT NULL DEFAULT false,
  valid_from date,
  valid_to date,
  CONSTRAINT sight_opening_hours_pkey PRIMARY KEY (id),
  CONSTRAINT sight_opening_hours_sight_id_fkey FOREIGN KEY (sight_id) REFERENCES public.sights(id)
);
CREATE TABLE public.sights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  destination_id uuid,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  slug text UNIQUE,
  summary text,
  body_richtext jsonb,
  lat numeric,
  lng numeric,
  open_hours jsonb,
  images jsonb,
  tags ARRAY,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
  updated_at timestamp with time zone DEFAULT now(),
  duration_minutes integer,
  provider text,
  deeplink text,
  gyg_id numeric,
  price_jpy numeric,
  price_gbp numeric,
  price_usd numeric,
  price_amount numeric,
  price_currency text DEFAULT 'JPY'::text,
  CONSTRAINT sights_pkey PRIMARY KEY (id),
  CONSTRAINT sights_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id)
);
CREATE TABLE public.tour_availability_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL,
  idx integer NOT NULL DEFAULT 0,
  days_of_week ARRAY NOT NULL CHECK (array_length(days_of_week, 1) >= 1 AND days_of_week <@ ARRAY[0::smallint, 1::smallint, 2::smallint, 3::smallint, 4::smallint, 5::smallint, 6::smallint]),
  start_times ARRAY NOT NULL CHECK (array_length(start_times, 1) >= 1),
  valid_from date,
  valid_to date,
  timezone text DEFAULT 'Asia/Tokyo'::text,
  CONSTRAINT tour_availability_rules_pkey PRIMARY KEY (id),
  CONSTRAINT tour_availability_rules_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id)
);
CREATE TABLE public.tour_exceptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL,
  date date NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['cancel'::text, 'add'::text, 'modify'::text])),
  start_time time without time zone,
  note text,
  CONSTRAINT tour_exceptions_pkey PRIMARY KEY (id),
  CONSTRAINT tour_exceptions_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id)
);
CREATE TABLE public.tours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  destination_id uuid,
  name text NOT NULL,
  slug text UNIQUE,
  summary text,
  description text,
  body_richtext jsonb,
  images jsonb,
  lat numeric,
  lng numeric,
  duration_minutes integer,
  price_jpy numeric,
  price_gbp numeric,
  price_usd numeric,
  price_amount numeric,
  price_currency text DEFAULT 'JPY'::text,
  provider text,
  deeplink text,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tours_pkey PRIMARY KEY (id),
  CONSTRAINT tours_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id)
);
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'customer'::text CHECK (role = ANY (ARRAY['admin'::text, 'customer'::text])),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);