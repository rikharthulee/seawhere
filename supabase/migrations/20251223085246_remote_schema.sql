drop extension if exists "pg_net";

create schema if not exists "staging";

create type "public"."content_status" as enum ('draft', 'published');

create type "public"."exception_action" as enum ('cancel', 'add', 'modify');

create type "public"."food_drink_type" as enum ('restaurant', 'bar', 'cafe', 'other');

create type "public"."itinerary_status" as enum ('draft', 'shared', 'confirmed', 'archived', 'published');

create type "public"."price_band" as enum ('$', '$$', '$$$', '$$$$', '$$$$$');

create type "public"."transport_category" as enum ('station', 'bus_stop', 'bus_terminal', 'ferry_pier', 'airport', 'entrance', 'other');

create type "public"."transport_mode" as enum ('WALK', 'TRAIN', 'METRO', 'BUS', 'TRAM', 'TAXI', 'DRIVE', 'FERRY', 'FLY', 'OTHER');

create type "public"."user_role" as enum ('admin', 'editor', 'customer');

create type "public"."visibility_status" as enum ('private', 'unlisted', 'public');


  create table "public"."accommodation" (
    "id" uuid not null default gen_random_uuid(),
    "slug" text not null,
    "name" text not null,
    "summary" text,
    "description" jsonb,
    "address" jsonb,
    "country_id" uuid,
    "destination_id" uuid,
    "lat" numeric,
    "lng" numeric,
    "rating" numeric,
    "price_band" public.price_band,
    "hero_image" text,
    "thumbnail_image" text,
    "images" jsonb,
    "website_url" text,
    "affiliate_url" text,
    "credit" text,
    "status" public.content_status not null default 'draft'::public.content_status,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."articles" (
    "id" uuid not null default gen_random_uuid(),
    "slug" text not null,
    "title" text not null,
    "excerpt" text,
    "body_richtext" jsonb,
    "cover_image" text,
    "author_id" uuid,
    "status" public.content_status not null default 'draft'::public.content_status,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "destination_id" uuid,
    "country_id" uuid
      );



  create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "kind" text not null default 'theme'::text,
    "description" text
      );



  create table "public"."category_links" (
    "category_id" uuid not null,
    "entity_type" text not null,
    "entity_id" uuid not null
      );



  create table "public"."content_views" (
    "content_type" text not null,
    "content_id" uuid not null,
    "views_total" bigint not null default 0,
    "last_viewed_at" timestamp with time zone,
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."countries" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "slug" text not null,
    "iso_code" text,
    "default_currency" text,
    "created_at" timestamp with time zone not null default now(),
    "summary" text,
    "hero_image" text
      );



  create table "public"."day_itineraries" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" jsonb,
    "maps_url" text,
    "status" public.content_status not null default 'draft'::public.content_status,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone,
    "summary" text,
    "destination_id" uuid,
    "country_id" uuid,
    "slug" text,
    "cover_image" text,
    "tags" text[] default '{}'::text[],
    "cost_band" text,
    "notes" text,
    "wheelchair_friendly" boolean not null default false,
    "good_with_kids" boolean not null default false
      );



  create table "public"."day_itinerary_items" (
    "id" uuid not null default gen_random_uuid(),
    "day_itinerary_id" uuid,
    "item_type" text not null,
    "ref_id" uuid,
    "sort_order" integer default 0,
    "details" text,
    "duration_minutes" integer,
    "maps_url" text
      );



  create table "public"."day_itinerary_notes" (
    "id" uuid not null default gen_random_uuid(),
    "title" text,
    "details" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."day_itinerary_transport_legs" (
    "id" uuid not null default gen_random_uuid(),
    "day_itinerary_id" uuid not null,
    "from_item_id" uuid not null,
    "to_item_id" uuid not null,
    "template_id" uuid,
    "primary_mode" public.transport_mode not null,
    "title" text,
    "summary" text,
    "steps" jsonb not null,
    "est_duration_min" integer,
    "est_distance_m" integer,
    "est_cost_min" numeric,
    "est_cost_max" numeric,
    "currency" text default 'USD'::text,
    "notes" text,
    "sort_order" integer,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."destination_links" (
    "from_location_id" uuid not null,
    "to_location_id" uuid not null,
    "relation" text not null,
    "weight" integer default 0
      );



  create table "public"."destinations" (
    "id" uuid not null default gen_random_uuid(),
    "country_id" uuid not null,
    "name" text not null,
    "slug" text not null,
    "summary" text,
    "body_richtext" jsonb,
    "credit" text,
    "lat" numeric,
    "lng" numeric,
    "status" public.content_status not null default 'draft'::public.content_status,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "gyg_location_id" numeric,
    "images" jsonb
      );



  create table "public"."exchange_rates" (
    "currency" text not null,
    "units_per_usd" numeric not null,
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."experience_availability_rules" (
    "id" uuid not null default gen_random_uuid(),
    "experience_id" uuid not null,
    "idx" integer not null default 0,
    "days_of_week" smallint[] not null,
    "start_times" time without time zone[] not null,
    "valid_from" date,
    "valid_to" date,
    "timezone" text default 'Asia/Bangkok'::text
      );



  create table "public"."experience_exceptions" (
    "id" uuid not null default gen_random_uuid(),
    "experience_id" uuid not null,
    "date" date not null,
    "action" public.exception_action not null,
    "start_time" time without time zone,
    "note" text
      );



  create table "public"."experiences" (
    "id" uuid not null default gen_random_uuid(),
    "slug" text not null,
    "name" text not null,
    "destination_id" uuid,
    "country_id" uuid,
    "description" text,
    "summary" text,
    "body_richtext" jsonb,
    "images" jsonb,
    "price" jsonb,
    "lat" numeric,
    "lng" numeric,
    "status" public.content_status not null default 'draft'::public.content_status,
    "price_amount" numeric,
    "price_currency" text,
    "external_ref_id" numeric,
    "duration_minutes" integer,
    "provider" text,
    "deeplink" text,
    "tags" text[] default '{}'::text[],
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "gyg_id" numeric
      );



  create table "public"."food_drink" (
    "id" uuid not null default gen_random_uuid(),
    "destination_id" uuid,
    "country_id" uuid,
    "name" text not null,
    "type" public.food_drink_type not null default 'restaurant'::public.food_drink_type,
    "address" text,
    "description" jsonb,
    "rating" numeric,
    "images" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "slug" text,
    "price_band" public.price_band,
    "tags" text[] default '{}'::text[],
    "booking_url" text,
    "status" public.content_status not null default 'draft'::public.content_status,
    "lat" numeric,
    "lng" numeric
      );



  create table "public"."hotels" (
    "id" uuid not null default gen_random_uuid(),
    "destination_id" uuid,
    "country_id" uuid,
    "name" text not null,
    "address" text,
    "description" text,
    "rating" numeric,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."itinerary_flights" (
    "id" uuid not null default gen_random_uuid(),
    "itinerary_id" uuid,
    "flight_number" text,
    "departure_airport" text,
    "arrival_airport" text,
    "departure_time" timestamp with time zone,
    "arrival_time" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid default auth.uid()
      );



  create table "public"."profiles" (
    "id" uuid not null,
    "role" public.user_role not null default 'customer'::public.user_role,
    "display_name" text,
    "avatar_url" text,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."sight_admission_prices" (
    "id" uuid not null default gen_random_uuid(),
    "sight_id" uuid not null,
    "idx" integer not null default 0,
    "label" text not null,
    "min_age" integer,
    "max_age" integer,
    "requires_id" boolean not null default false,
    "amount" numeric,
    "currency" text not null default 'USD'::text,
    "is_free" boolean not null default false,
    "valid_from" date,
    "valid_to" date,
    "note" text,
    "external_url" text,
    "subsection" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."sight_opening_exceptions" (
    "id" uuid not null default gen_random_uuid(),
    "sight_id" uuid not null,
    "type" text not null,
    "start_date" date,
    "end_date" date,
    "weekday" smallint,
    "note" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."sight_opening_hours" (
    "id" uuid not null default gen_random_uuid(),
    "sight_id" uuid not null,
    "start_month" integer not null,
    "start_day" integer,
    "end_month" integer not null,
    "end_day" integer,
    "open_time" time without time zone,
    "close_time" time without time zone,
    "last_entry_mins" integer not null default 0,
    "days" jsonb,
    "is_closed" boolean default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."sights" (
    "id" uuid not null default gen_random_uuid(),
    "destination_id" uuid,
    "country_id" uuid,
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone not null default now(),
    "slug" text,
    "summary" text,
    "body_richtext" jsonb,
    "lat" numeric,
    "lng" numeric,
    "open_hours" jsonb,
    "images" jsonb,
    "tags" text[] default '{}'::text[],
    "status" public.content_status not null default 'draft'::public.content_status,
    "updated_at" timestamp with time zone not null default now(),
    "duration_minutes" integer,
    "provider" text,
    "deeplink" text,
    "external_ref_id" numeric,
    "price_amount" numeric,
    "price_currency" text,
    "opening_times_url" text,
    "maps_place_id" text,
    "gyg_id" numeric
      );



  create table "public"."tour_availability_rules" (
    "id" uuid not null default gen_random_uuid(),
    "tour_id" uuid not null,
    "idx" integer not null default 0,
    "days_of_week" smallint[] not null,
    "start_times" time without time zone[] not null,
    "valid_from" date,
    "valid_to" date,
    "timezone" text default 'Asia/Bangkok'::text
      );



  create table "public"."tour_exceptions" (
    "id" uuid not null default gen_random_uuid(),
    "tour_id" uuid not null,
    "date" date not null,
    "action" public.exception_action not null,
    "start_time" time without time zone,
    "note" text
      );



  create table "public"."tours" (
    "id" uuid not null default gen_random_uuid(),
    "destination_id" uuid,
    "country_id" uuid,
    "name" text not null,
    "slug" text,
    "summary" text,
    "description" text,
    "body_richtext" jsonb,
    "images" jsonb,
    "lat" numeric,
    "lng" numeric,
    "duration_minutes" integer,
    "price_amount" numeric,
    "price_currency" text,
    "provider" text,
    "deeplink" text,
    "status" public.content_status not null default 'draft'::public.content_status,
    "price" jsonb,
    "external_ref_id" numeric,
    "tags" text[] default '{}'::text[],
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "gyg_id" numeric
      );



  create table "public"."transport" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "category" public.transport_category not null,
    "country_id" uuid,
    "destination_id" uuid,
    "lat" numeric,
    "lng" numeric,
    "google_place_id" text,
    "slug" text,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."transport_templates" (
    "id" uuid not null default gen_random_uuid(),
    "from_transport_id" uuid not null,
    "to_transport_id" uuid not null,
    "primary_mode" public.transport_mode not null,
    "title" text,
    "summary" text,
    "steps" jsonb not null,
    "est_duration_min" integer,
    "est_distance_m" integer,
    "est_cost_min" numeric,
    "est_cost_max" numeric,
    "currency" text default 'USD'::text,
    "tags" text[] default '{}'::text[],
    "language" text default 'en'::text,
    "version" integer default 1,
    "is_active" boolean default true,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."trip_day_items" (
    "id" uuid not null default gen_random_uuid(),
    "day_id" uuid,
    "item_type" text not null,
    "ref_id" uuid,
    "notes" text,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid default auth.uid()
      );



  create table "public"."trip_days" (
    "id" uuid not null default gen_random_uuid(),
    "trip_id" uuid,
    "day_index" integer not null,
    "title" text,
    "destination_id" uuid,
    "sub_destination_id" uuid,
    "accommodation_id" uuid,
    "date" date,
    "created_by" uuid default auth.uid(),
    "day_itinerary_id" uuid
      );



  create table "public"."trips" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid,
    "title" text,
    "destination_id" uuid,
    "country_id" uuid,
    "start_date" date,
    "end_date" date,
    "status" public.itinerary_status not null default 'draft'::public.itinerary_status,
    "visibility" public.visibility_status not null default 'private'::public.visibility_status,
    "notes" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "created_by" uuid default auth.uid(),
    "summary" text
      );



  create table "public"."user_roles" (
    "user_id" uuid not null,
    "role" public.user_role not null default 'customer'::public.user_role,
    "updated_at" timestamp with time zone not null default now()
      );



  create table "staging"."sights_import" (
    "country_slug" text,
    "destination_slug" text,
    "name" text,
    "slug" text,
    "summary" text,
    "description" text,
    "lat" numeric,
    "lng" numeric,
    "duration_minutes" integer,
    "provider" text,
    "deeplink" text,
    "price_amount" numeric,
    "price_currency" text,
    "opening_times_url" text,
    "maps_place_id" text,
    "gyg_id" text,
    "status" text,
    "tags" text
      );


CREATE UNIQUE INDEX accommodation_pkey ON public.accommodation USING btree (id);

CREATE UNIQUE INDEX accommodation_slug_key ON public.accommodation USING btree (slug);

CREATE UNIQUE INDEX articles_pkey ON public.articles USING btree (id);

CREATE UNIQUE INDEX articles_slug_key ON public.articles USING btree (slug);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);

CREATE UNIQUE INDEX category_links_pkey ON public.category_links USING btree (entity_type, entity_id, category_id);

CREATE UNIQUE INDEX content_views_pkey ON public.content_views USING btree (content_type, content_id);

CREATE UNIQUE INDEX countries_pkey ON public.countries USING btree (id);

CREATE UNIQUE INDEX countries_slug_key ON public.countries USING btree (slug);

CREATE UNIQUE INDEX destination_links_pkey ON public.destination_links USING btree (from_location_id, relation, to_location_id);

CREATE UNIQUE INDEX destinations_pkey ON public.destinations USING btree (id);

CREATE UNIQUE INDEX destinations_slug_key ON public.destinations USING btree (slug);

CREATE UNIQUE INDEX exchange_rates_pkey ON public.exchange_rates USING btree (currency);

CREATE UNIQUE INDEX excursion_items_pkey ON public.day_itinerary_items USING btree (id);

CREATE UNIQUE INDEX excursion_notes_pkey ON public.day_itinerary_notes USING btree (id);

CREATE UNIQUE INDEX excursion_transport_legs_pkey ON public.day_itinerary_transport_legs USING btree (id);

CREATE UNIQUE INDEX excursions_pkey ON public.day_itineraries USING btree (id);

CREATE UNIQUE INDEX excursions_slug_key ON public.day_itineraries USING btree (slug);

CREATE UNIQUE INDEX experience_availability_rules_pkey ON public.experience_availability_rules USING btree (id);

CREATE UNIQUE INDEX experience_exceptions_pkey ON public.experience_exceptions USING btree (id);

CREATE UNIQUE INDEX experiences_pkey ON public.experiences USING btree (id);

CREATE UNIQUE INDEX experiences_slug_key ON public.experiences USING btree (slug);

CREATE UNIQUE INDEX food_drink_pkey ON public.food_drink USING btree (id);

CREATE UNIQUE INDEX hotels_pkey ON public.hotels USING btree (id);

CREATE INDEX idx_content_views_last_viewed ON public.content_views USING btree (last_viewed_at DESC);

CREATE INDEX idx_content_views_type_total ON public.content_views USING btree (content_type, views_total DESC);

CREATE INDEX idx_countries_name ON public.countries USING btree (name);

CREATE UNIQUE INDEX itineraries_pkey ON public.trips USING btree (id);

CREATE UNIQUE INDEX itinerary_day_items_pkey ON public.trip_day_items USING btree (id);

CREATE UNIQUE INDEX itinerary_days_pkey ON public.trip_days USING btree (id);

CREATE UNIQUE INDEX itinerary_flights_pkey ON public.itinerary_flights USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX sight_admission_prices_pkey ON public.sight_admission_prices USING btree (id);

CREATE UNIQUE INDEX sight_opening_exceptions_pkey ON public.sight_opening_exceptions USING btree (id);

CREATE UNIQUE INDEX sight_opening_hours_pkey ON public.sight_opening_hours USING btree (id);

CREATE UNIQUE INDEX sights_pkey ON public.sights USING btree (id);

CREATE UNIQUE INDEX sights_slug_key ON public.sights USING btree (slug);

CREATE UNIQUE INDEX tour_availability_rules_pkey ON public.tour_availability_rules USING btree (id);

CREATE UNIQUE INDEX tour_exceptions_pkey ON public.tour_exceptions USING btree (id);

CREATE UNIQUE INDEX tours_pkey ON public.tours USING btree (id);

CREATE UNIQUE INDEX tours_slug_key ON public.tours USING btree (slug);

CREATE UNIQUE INDEX transport_pkey ON public.transport USING btree (id);

CREATE UNIQUE INDEX transport_slug_key ON public.transport USING btree (slug);

CREATE UNIQUE INDEX transport_templates_pkey ON public.transport_templates USING btree (id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (user_id);

alter table "public"."accommodation" add constraint "accommodation_pkey" PRIMARY KEY using index "accommodation_pkey";

alter table "public"."articles" add constraint "articles_pkey" PRIMARY KEY using index "articles_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."category_links" add constraint "category_links_pkey" PRIMARY KEY using index "category_links_pkey";

alter table "public"."content_views" add constraint "content_views_pkey" PRIMARY KEY using index "content_views_pkey";

alter table "public"."countries" add constraint "countries_pkey" PRIMARY KEY using index "countries_pkey";

alter table "public"."day_itineraries" add constraint "excursions_pkey" PRIMARY KEY using index "excursions_pkey";

alter table "public"."day_itinerary_items" add constraint "excursion_items_pkey" PRIMARY KEY using index "excursion_items_pkey";

alter table "public"."day_itinerary_notes" add constraint "excursion_notes_pkey" PRIMARY KEY using index "excursion_notes_pkey";

alter table "public"."day_itinerary_transport_legs" add constraint "excursion_transport_legs_pkey" PRIMARY KEY using index "excursion_transport_legs_pkey";

alter table "public"."destination_links" add constraint "destination_links_pkey" PRIMARY KEY using index "destination_links_pkey";

alter table "public"."destinations" add constraint "destinations_pkey" PRIMARY KEY using index "destinations_pkey";

alter table "public"."exchange_rates" add constraint "exchange_rates_pkey" PRIMARY KEY using index "exchange_rates_pkey";

alter table "public"."experience_availability_rules" add constraint "experience_availability_rules_pkey" PRIMARY KEY using index "experience_availability_rules_pkey";

alter table "public"."experience_exceptions" add constraint "experience_exceptions_pkey" PRIMARY KEY using index "experience_exceptions_pkey";

alter table "public"."experiences" add constraint "experiences_pkey" PRIMARY KEY using index "experiences_pkey";

alter table "public"."food_drink" add constraint "food_drink_pkey" PRIMARY KEY using index "food_drink_pkey";

alter table "public"."hotels" add constraint "hotels_pkey" PRIMARY KEY using index "hotels_pkey";

alter table "public"."itinerary_flights" add constraint "itinerary_flights_pkey" PRIMARY KEY using index "itinerary_flights_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."sight_admission_prices" add constraint "sight_admission_prices_pkey" PRIMARY KEY using index "sight_admission_prices_pkey";

alter table "public"."sight_opening_exceptions" add constraint "sight_opening_exceptions_pkey" PRIMARY KEY using index "sight_opening_exceptions_pkey";

alter table "public"."sight_opening_hours" add constraint "sight_opening_hours_pkey" PRIMARY KEY using index "sight_opening_hours_pkey";

alter table "public"."sights" add constraint "sights_pkey" PRIMARY KEY using index "sights_pkey";

alter table "public"."tour_availability_rules" add constraint "tour_availability_rules_pkey" PRIMARY KEY using index "tour_availability_rules_pkey";

alter table "public"."tour_exceptions" add constraint "tour_exceptions_pkey" PRIMARY KEY using index "tour_exceptions_pkey";

alter table "public"."tours" add constraint "tours_pkey" PRIMARY KEY using index "tours_pkey";

alter table "public"."transport" add constraint "transport_pkey" PRIMARY KEY using index "transport_pkey";

alter table "public"."transport_templates" add constraint "transport_templates_pkey" PRIMARY KEY using index "transport_templates_pkey";

alter table "public"."trip_day_items" add constraint "itinerary_day_items_pkey" PRIMARY KEY using index "itinerary_day_items_pkey";

alter table "public"."trip_days" add constraint "itinerary_days_pkey" PRIMARY KEY using index "itinerary_days_pkey";

alter table "public"."trips" add constraint "itineraries_pkey" PRIMARY KEY using index "itineraries_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."accommodation" add constraint "accommodation_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(id) not valid;

alter table "public"."accommodation" validate constraint "accommodation_country_id_fkey";

alter table "public"."accommodation" add constraint "accommodation_destination_id_fkey" FOREIGN KEY (destination_id) REFERENCES public.destinations(id) not valid;

alter table "public"."accommodation" validate constraint "accommodation_destination_id_fkey";

alter table "public"."accommodation" add constraint "accommodation_slug_key" UNIQUE using index "accommodation_slug_key";

alter table "public"."articles" add constraint "articles_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) not valid;

alter table "public"."articles" validate constraint "articles_author_id_fkey";

alter table "public"."articles" add constraint "articles_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(id) not valid;

alter table "public"."articles" validate constraint "articles_country_id_fkey";

alter table "public"."articles" add constraint "articles_destination_id_fkey" FOREIGN KEY (destination_id) REFERENCES public.destinations(id) not valid;

alter table "public"."articles" validate constraint "articles_destination_id_fkey";

alter table "public"."articles" add constraint "articles_slug_key" UNIQUE using index "articles_slug_key";

alter table "public"."categories" add constraint "categories_kind_check" CHECK ((kind = ANY (ARRAY['theme'::text, 'season'::text, 'interest'::text, 'rail_pass'::text, 'other'::text]))) not valid;

alter table "public"."categories" validate constraint "categories_kind_check";

alter table "public"."categories" add constraint "categories_slug_key" UNIQUE using index "categories_slug_key";

alter table "public"."category_links" add constraint "category_links_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."category_links" validate constraint "category_links_category_id_fkey";

alter table "public"."category_links" add constraint "category_links_entity_type_check" CHECK ((entity_type = ANY (ARRAY['destination'::text, 'poi'::text, 'accommodation'::text, 'article'::text, 'experience'::text, 'tour'::text, 'sight'::text, 'food_drink'::text]))) not valid;

alter table "public"."category_links" validate constraint "category_links_entity_type_check";

alter table "public"."countries" add constraint "countries_slug_key" UNIQUE using index "countries_slug_key";

alter table "public"."day_itineraries" add constraint "excursions_cost_band_check" CHECK ((cost_band = ANY (ARRAY['budget'::text, 'midrange'::text, 'premium'::text, 'luxury'::text]))) not valid;

alter table "public"."day_itineraries" validate constraint "excursions_cost_band_check";

alter table "public"."day_itineraries" add constraint "excursions_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(id) not valid;

alter table "public"."day_itineraries" validate constraint "excursions_country_id_fkey";

alter table "public"."day_itineraries" add constraint "excursions_destination_id_fkey" FOREIGN KEY (destination_id) REFERENCES public.destinations(id) not valid;

alter table "public"."day_itineraries" validate constraint "excursions_destination_id_fkey";

alter table "public"."day_itineraries" add constraint "excursions_slug_key" UNIQUE using index "excursions_slug_key";

alter table "public"."day_itinerary_items" add constraint "day_itinerary_items_day_itinerary_id_fkey" FOREIGN KEY (day_itinerary_id) REFERENCES public.day_itineraries(id) ON DELETE CASCADE not valid;

alter table "public"."day_itinerary_items" validate constraint "day_itinerary_items_day_itinerary_id_fkey";

alter table "public"."day_itinerary_transport_legs" add constraint "excursion_transport_legs_excursion_id_fkey" FOREIGN KEY (day_itinerary_id) REFERENCES public.day_itineraries(id) not valid;

alter table "public"."day_itinerary_transport_legs" validate constraint "excursion_transport_legs_excursion_id_fkey";

alter table "public"."day_itinerary_transport_legs" add constraint "excursion_transport_legs_from_item_id_fkey" FOREIGN KEY (from_item_id) REFERENCES public.day_itinerary_items(id) not valid;

alter table "public"."day_itinerary_transport_legs" validate constraint "excursion_transport_legs_from_item_id_fkey";

alter table "public"."day_itinerary_transport_legs" add constraint "excursion_transport_legs_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.transport_templates(id) not valid;

alter table "public"."day_itinerary_transport_legs" validate constraint "excursion_transport_legs_template_id_fkey";

alter table "public"."day_itinerary_transport_legs" add constraint "excursion_transport_legs_to_item_id_fkey" FOREIGN KEY (to_item_id) REFERENCES public.day_itinerary_items(id) not valid;

alter table "public"."day_itinerary_transport_legs" validate constraint "excursion_transport_legs_to_item_id_fkey";

alter table "public"."destination_links" add constraint "destination_links_from_location_id_fkey" FOREIGN KEY (from_location_id) REFERENCES public.destinations(id) not valid;

alter table "public"."destination_links" validate constraint "destination_links_from_location_id_fkey";

alter table "public"."destination_links" add constraint "destination_links_relation_check" CHECK ((relation = ANY (ARRAY['nearby'::text, 'day_trip'::text, 'gateway'::text, 'sister_area'::text]))) not valid;

alter table "public"."destination_links" validate constraint "destination_links_relation_check";

alter table "public"."destination_links" add constraint "destination_links_to_location_id_fkey" FOREIGN KEY (to_location_id) REFERENCES public.destinations(id) not valid;

alter table "public"."destination_links" validate constraint "destination_links_to_location_id_fkey";

alter table "public"."destinations" add constraint "destinations_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(id) not valid;

alter table "public"."destinations" validate constraint "destinations_country_id_fkey";

alter table "public"."destinations" add constraint "destinations_slug_key" UNIQUE using index "destinations_slug_key";

alter table "public"."exchange_rates" add constraint "exchange_rates_units_per_usd_check" CHECK ((units_per_usd > (0)::numeric)) not valid;

alter table "public"."exchange_rates" validate constraint "exchange_rates_units_per_usd_check";

alter table "public"."experience_availability_rules" add constraint "experience_availability_rules_days_of_week_check" CHECK (((array_length(days_of_week, 1) >= 1) AND (days_of_week <@ ARRAY[(0)::smallint, (1)::smallint, (2)::smallint, (3)::smallint, (4)::smallint, (5)::smallint, (6)::smallint]))) not valid;

alter table "public"."experience_availability_rules" validate constraint "experience_availability_rules_days_of_week_check";

alter table "public"."experience_availability_rules" add constraint "experience_availability_rules_experience_id_fkey" FOREIGN KEY (experience_id) REFERENCES public.experiences(id) not valid;

alter table "public"."experience_availability_rules" validate constraint "experience_availability_rules_experience_id_fkey";

alter table "public"."experience_availability_rules" add constraint "experience_availability_rules_start_times_check" CHECK ((array_length(start_times, 1) >= 1)) not valid;

alter table "public"."experience_availability_rules" validate constraint "experience_availability_rules_start_times_check";

alter table "public"."experience_exceptions" add constraint "experience_exceptions_experience_id_fkey" FOREIGN KEY (experience_id) REFERENCES public.experiences(id) not valid;

alter table "public"."experience_exceptions" validate constraint "experience_exceptions_experience_id_fkey";

alter table "public"."experiences" add constraint "experiences_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(id) not valid;

alter table "public"."experiences" validate constraint "experiences_country_id_fkey";

alter table "public"."experiences" add constraint "experiences_destination_id_fkey" FOREIGN KEY (destination_id) REFERENCES public.destinations(id) not valid;

alter table "public"."experiences" validate constraint "experiences_destination_id_fkey";

alter table "public"."experiences" add constraint "experiences_slug_key" UNIQUE using index "experiences_slug_key";

alter table "public"."food_drink" add constraint "food_drink_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(id) not valid;

alter table "public"."food_drink" validate constraint "food_drink_country_id_fkey";

alter table "public"."food_drink" add constraint "food_drink_destination_id_fkey" FOREIGN KEY (destination_id) REFERENCES public.destinations(id) not valid;

alter table "public"."food_drink" validate constraint "food_drink_destination_id_fkey";

alter table "public"."hotels" add constraint "hotels_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(id) not valid;

alter table "public"."hotels" validate constraint "hotels_country_id_fkey";

alter table "public"."hotels" add constraint "hotels_destination_id_fkey" FOREIGN KEY (destination_id) REFERENCES public.destinations(id) not valid;

alter table "public"."hotels" validate constraint "hotels_destination_id_fkey";

alter table "public"."itinerary_flights" add constraint "itinerary_flights_itinerary_id_fkey" FOREIGN KEY (itinerary_id) REFERENCES public.trips(id) not valid;

alter table "public"."itinerary_flights" validate constraint "itinerary_flights_itinerary_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."sight_admission_prices" add constraint "sight_admission_prices_sight_id_fkey" FOREIGN KEY (sight_id) REFERENCES public.sights(id) not valid;

alter table "public"."sight_admission_prices" validate constraint "sight_admission_prices_sight_id_fkey";

alter table "public"."sight_opening_exceptions" add constraint "sight_opening_exceptions_sight_id_fkey" FOREIGN KEY (sight_id) REFERENCES public.sights(id) not valid;

alter table "public"."sight_opening_exceptions" validate constraint "sight_opening_exceptions_sight_id_fkey";

alter table "public"."sight_opening_exceptions" add constraint "sight_opening_exceptions_type_check" CHECK ((type = ANY (ARRAY['closed'::text, 'reduced_hours'::text, 'extended_hours'::text, 'special_event'::text]))) not valid;

alter table "public"."sight_opening_exceptions" validate constraint "sight_opening_exceptions_type_check";

alter table "public"."sight_opening_hours" add constraint "sight_opening_hours_end_day_check" CHECK (((end_day >= 1) AND (end_day <= 31))) not valid;

alter table "public"."sight_opening_hours" validate constraint "sight_opening_hours_end_day_check";

alter table "public"."sight_opening_hours" add constraint "sight_opening_hours_end_month_check" CHECK (((end_month >= 1) AND (end_month <= 12))) not valid;

alter table "public"."sight_opening_hours" validate constraint "sight_opening_hours_end_month_check";

alter table "public"."sight_opening_hours" add constraint "sight_opening_hours_last_entry_mins_check" CHECK ((last_entry_mins >= 0)) not valid;

alter table "public"."sight_opening_hours" validate constraint "sight_opening_hours_last_entry_mins_check";

alter table "public"."sight_opening_hours" add constraint "sight_opening_hours_sight_id_fkey" FOREIGN KEY (sight_id) REFERENCES public.sights(id) not valid;

alter table "public"."sight_opening_hours" validate constraint "sight_opening_hours_sight_id_fkey";

alter table "public"."sight_opening_hours" add constraint "sight_opening_hours_start_day_check" CHECK (((start_day >= 1) AND (start_day <= 31))) not valid;

alter table "public"."sight_opening_hours" validate constraint "sight_opening_hours_start_day_check";

alter table "public"."sight_opening_hours" add constraint "sight_opening_hours_start_month_check" CHECK (((start_month >= 1) AND (start_month <= 12))) not valid;

alter table "public"."sight_opening_hours" validate constraint "sight_opening_hours_start_month_check";

alter table "public"."sights" add constraint "sights_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(id) not valid;

alter table "public"."sights" validate constraint "sights_country_id_fkey";

alter table "public"."sights" add constraint "sights_destination_id_fkey" FOREIGN KEY (destination_id) REFERENCES public.destinations(id) not valid;

alter table "public"."sights" validate constraint "sights_destination_id_fkey";

alter table "public"."sights" add constraint "sights_slug_key" UNIQUE using index "sights_slug_key";

alter table "public"."tour_availability_rules" add constraint "tour_availability_rules_days_of_week_check" CHECK (((array_length(days_of_week, 1) >= 1) AND (days_of_week <@ ARRAY[(0)::smallint, (1)::smallint, (2)::smallint, (3)::smallint, (4)::smallint, (5)::smallint, (6)::smallint]))) not valid;

alter table "public"."tour_availability_rules" validate constraint "tour_availability_rules_days_of_week_check";

alter table "public"."tour_availability_rules" add constraint "tour_availability_rules_start_times_check" CHECK ((array_length(start_times, 1) >= 1)) not valid;

alter table "public"."tour_availability_rules" validate constraint "tour_availability_rules_start_times_check";

alter table "public"."tour_availability_rules" add constraint "tour_availability_rules_tour_id_fkey" FOREIGN KEY (tour_id) REFERENCES public.tours(id) not valid;

alter table "public"."tour_availability_rules" validate constraint "tour_availability_rules_tour_id_fkey";

alter table "public"."tour_exceptions" add constraint "tour_exceptions_tour_id_fkey" FOREIGN KEY (tour_id) REFERENCES public.tours(id) not valid;

alter table "public"."tour_exceptions" validate constraint "tour_exceptions_tour_id_fkey";

alter table "public"."tours" add constraint "tours_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(id) not valid;

alter table "public"."tours" validate constraint "tours_country_id_fkey";

alter table "public"."tours" add constraint "tours_destination_id_fkey" FOREIGN KEY (destination_id) REFERENCES public.destinations(id) not valid;

alter table "public"."tours" validate constraint "tours_destination_id_fkey";

alter table "public"."tours" add constraint "tours_slug_key" UNIQUE using index "tours_slug_key";

alter table "public"."transport" add constraint "transport_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(id) not valid;

alter table "public"."transport" validate constraint "transport_country_id_fkey";

alter table "public"."transport" add constraint "transport_destination_id_fkey" FOREIGN KEY (destination_id) REFERENCES public.destinations(id) not valid;

alter table "public"."transport" validate constraint "transport_destination_id_fkey";

alter table "public"."transport" add constraint "transport_slug_key" UNIQUE using index "transport_slug_key";

alter table "public"."transport_templates" add constraint "transport_templates_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."transport_templates" validate constraint "transport_templates_created_by_fkey";

alter table "public"."transport_templates" add constraint "transport_templates_from_transport_id_fkey" FOREIGN KEY (from_transport_id) REFERENCES public.transport(id) not valid;

alter table "public"."transport_templates" validate constraint "transport_templates_from_transport_id_fkey";

alter table "public"."transport_templates" add constraint "transport_templates_to_transport_id_fkey" FOREIGN KEY (to_transport_id) REFERENCES public.transport(id) not valid;

alter table "public"."transport_templates" validate constraint "transport_templates_to_transport_id_fkey";

alter table "public"."trip_day_items" add constraint "itinerary_day_items_item_type_check" CHECK ((item_type = ANY (ARRAY['hotel'::text, 'excursion'::text, 'sight'::text, 'tour'::text, 'food_drink'::text, 'note'::text, 'transport'::text, 'custom'::text]))) not valid;

alter table "public"."trip_day_items" validate constraint "itinerary_day_items_item_type_check";

alter table "public"."trip_day_items" add constraint "trip_day_items_day_id_fkey" FOREIGN KEY (day_id) REFERENCES public.trip_days(id) ON DELETE CASCADE not valid;

alter table "public"."trip_day_items" validate constraint "trip_day_items_day_id_fkey";

alter table "public"."trip_days" add constraint "itinerary_days_accommodation_id_fkey" FOREIGN KEY (accommodation_id) REFERENCES public.accommodation(id) not valid;

alter table "public"."trip_days" validate constraint "itinerary_days_accommodation_id_fkey";

alter table "public"."trip_days" add constraint "itinerary_days_destination_id_fkey" FOREIGN KEY (destination_id) REFERENCES public.destinations(id) not valid;

alter table "public"."trip_days" validate constraint "itinerary_days_destination_id_fkey";

alter table "public"."trip_days" add constraint "itinerary_days_sub_destination_id_fkey" FOREIGN KEY (sub_destination_id) REFERENCES public.destinations(id) not valid;

alter table "public"."trip_days" validate constraint "itinerary_days_sub_destination_id_fkey";

alter table "public"."trip_days" add constraint "trip_days_day_itinerary_id_fkey" FOREIGN KEY (day_itinerary_id) REFERENCES public.day_itineraries(id) ON DELETE SET NULL not valid;

alter table "public"."trip_days" validate constraint "trip_days_day_itinerary_id_fkey";

alter table "public"."trip_days" add constraint "trip_days_trip_id_fkey" FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE not valid;

alter table "public"."trip_days" validate constraint "trip_days_trip_id_fkey";

alter table "public"."trips" add constraint "itineraries_country_id_fkey" FOREIGN KEY (country_id) REFERENCES public.countries(id) not valid;

alter table "public"."trips" validate constraint "itineraries_country_id_fkey";

alter table "public"."trips" add constraint "itineraries_destination_id_fkey" FOREIGN KEY (destination_id) REFERENCES public.destinations(id) not valid;

alter table "public"."trips" validate constraint "itineraries_destination_id_fkey";

alter table "public"."trips" add constraint "itineraries_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) not valid;

alter table "public"."trips" validate constraint "itineraries_owner_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.increment_view(p_type text, p_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.content_views (content_type, content_id, views_total, last_viewed_at)
  values (p_type, p_id, 1, now())
  on conflict (content_type, content_id)
  do update set
    views_total = public.content_views.views_total + 1,
    last_viewed_at = now(),
    updated_at = now();
end;
$function$
;

grant delete on table "public"."accommodation" to "anon";

grant insert on table "public"."accommodation" to "anon";

grant references on table "public"."accommodation" to "anon";

grant select on table "public"."accommodation" to "anon";

grant trigger on table "public"."accommodation" to "anon";

grant truncate on table "public"."accommodation" to "anon";

grant update on table "public"."accommodation" to "anon";

grant delete on table "public"."accommodation" to "authenticated";

grant insert on table "public"."accommodation" to "authenticated";

grant references on table "public"."accommodation" to "authenticated";

grant select on table "public"."accommodation" to "authenticated";

grant trigger on table "public"."accommodation" to "authenticated";

grant truncate on table "public"."accommodation" to "authenticated";

grant update on table "public"."accommodation" to "authenticated";

grant delete on table "public"."accommodation" to "service_role";

grant insert on table "public"."accommodation" to "service_role";

grant references on table "public"."accommodation" to "service_role";

grant select on table "public"."accommodation" to "service_role";

grant trigger on table "public"."accommodation" to "service_role";

grant truncate on table "public"."accommodation" to "service_role";

grant update on table "public"."accommodation" to "service_role";

grant delete on table "public"."articles" to "anon";

grant insert on table "public"."articles" to "anon";

grant references on table "public"."articles" to "anon";

grant select on table "public"."articles" to "anon";

grant trigger on table "public"."articles" to "anon";

grant truncate on table "public"."articles" to "anon";

grant update on table "public"."articles" to "anon";

grant delete on table "public"."articles" to "authenticated";

grant insert on table "public"."articles" to "authenticated";

grant references on table "public"."articles" to "authenticated";

grant select on table "public"."articles" to "authenticated";

grant trigger on table "public"."articles" to "authenticated";

grant truncate on table "public"."articles" to "authenticated";

grant update on table "public"."articles" to "authenticated";

grant delete on table "public"."articles" to "service_role";

grant insert on table "public"."articles" to "service_role";

grant references on table "public"."articles" to "service_role";

grant select on table "public"."articles" to "service_role";

grant trigger on table "public"."articles" to "service_role";

grant truncate on table "public"."articles" to "service_role";

grant update on table "public"."articles" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."category_links" to "anon";

grant insert on table "public"."category_links" to "anon";

grant references on table "public"."category_links" to "anon";

grant select on table "public"."category_links" to "anon";

grant trigger on table "public"."category_links" to "anon";

grant truncate on table "public"."category_links" to "anon";

grant update on table "public"."category_links" to "anon";

grant delete on table "public"."category_links" to "authenticated";

grant insert on table "public"."category_links" to "authenticated";

grant references on table "public"."category_links" to "authenticated";

grant select on table "public"."category_links" to "authenticated";

grant trigger on table "public"."category_links" to "authenticated";

grant truncate on table "public"."category_links" to "authenticated";

grant update on table "public"."category_links" to "authenticated";

grant delete on table "public"."category_links" to "service_role";

grant insert on table "public"."category_links" to "service_role";

grant references on table "public"."category_links" to "service_role";

grant select on table "public"."category_links" to "service_role";

grant trigger on table "public"."category_links" to "service_role";

grant truncate on table "public"."category_links" to "service_role";

grant update on table "public"."category_links" to "service_role";

grant delete on table "public"."content_views" to "anon";

grant insert on table "public"."content_views" to "anon";

grant references on table "public"."content_views" to "anon";

grant select on table "public"."content_views" to "anon";

grant trigger on table "public"."content_views" to "anon";

grant truncate on table "public"."content_views" to "anon";

grant update on table "public"."content_views" to "anon";

grant delete on table "public"."content_views" to "authenticated";

grant insert on table "public"."content_views" to "authenticated";

grant references on table "public"."content_views" to "authenticated";

grant select on table "public"."content_views" to "authenticated";

grant trigger on table "public"."content_views" to "authenticated";

grant truncate on table "public"."content_views" to "authenticated";

grant update on table "public"."content_views" to "authenticated";

grant delete on table "public"."content_views" to "service_role";

grant insert on table "public"."content_views" to "service_role";

grant references on table "public"."content_views" to "service_role";

grant select on table "public"."content_views" to "service_role";

grant trigger on table "public"."content_views" to "service_role";

grant truncate on table "public"."content_views" to "service_role";

grant update on table "public"."content_views" to "service_role";

grant delete on table "public"."countries" to "anon";

grant insert on table "public"."countries" to "anon";

grant references on table "public"."countries" to "anon";

grant select on table "public"."countries" to "anon";

grant trigger on table "public"."countries" to "anon";

grant truncate on table "public"."countries" to "anon";

grant update on table "public"."countries" to "anon";

grant delete on table "public"."countries" to "authenticated";

grant insert on table "public"."countries" to "authenticated";

grant references on table "public"."countries" to "authenticated";

grant select on table "public"."countries" to "authenticated";

grant trigger on table "public"."countries" to "authenticated";

grant truncate on table "public"."countries" to "authenticated";

grant update on table "public"."countries" to "authenticated";

grant delete on table "public"."countries" to "service_role";

grant insert on table "public"."countries" to "service_role";

grant references on table "public"."countries" to "service_role";

grant select on table "public"."countries" to "service_role";

grant trigger on table "public"."countries" to "service_role";

grant truncate on table "public"."countries" to "service_role";

grant update on table "public"."countries" to "service_role";

grant delete on table "public"."day_itineraries" to "anon";

grant insert on table "public"."day_itineraries" to "anon";

grant references on table "public"."day_itineraries" to "anon";

grant select on table "public"."day_itineraries" to "anon";

grant trigger on table "public"."day_itineraries" to "anon";

grant truncate on table "public"."day_itineraries" to "anon";

grant update on table "public"."day_itineraries" to "anon";

grant delete on table "public"."day_itineraries" to "authenticated";

grant insert on table "public"."day_itineraries" to "authenticated";

grant references on table "public"."day_itineraries" to "authenticated";

grant select on table "public"."day_itineraries" to "authenticated";

grant trigger on table "public"."day_itineraries" to "authenticated";

grant truncate on table "public"."day_itineraries" to "authenticated";

grant update on table "public"."day_itineraries" to "authenticated";

grant delete on table "public"."day_itineraries" to "service_role";

grant insert on table "public"."day_itineraries" to "service_role";

grant references on table "public"."day_itineraries" to "service_role";

grant select on table "public"."day_itineraries" to "service_role";

grant trigger on table "public"."day_itineraries" to "service_role";

grant truncate on table "public"."day_itineraries" to "service_role";

grant update on table "public"."day_itineraries" to "service_role";

grant delete on table "public"."day_itinerary_items" to "anon";

grant insert on table "public"."day_itinerary_items" to "anon";

grant references on table "public"."day_itinerary_items" to "anon";

grant select on table "public"."day_itinerary_items" to "anon";

grant trigger on table "public"."day_itinerary_items" to "anon";

grant truncate on table "public"."day_itinerary_items" to "anon";

grant update on table "public"."day_itinerary_items" to "anon";

grant delete on table "public"."day_itinerary_items" to "authenticated";

grant insert on table "public"."day_itinerary_items" to "authenticated";

grant references on table "public"."day_itinerary_items" to "authenticated";

grant select on table "public"."day_itinerary_items" to "authenticated";

grant trigger on table "public"."day_itinerary_items" to "authenticated";

grant truncate on table "public"."day_itinerary_items" to "authenticated";

grant update on table "public"."day_itinerary_items" to "authenticated";

grant delete on table "public"."day_itinerary_items" to "service_role";

grant insert on table "public"."day_itinerary_items" to "service_role";

grant references on table "public"."day_itinerary_items" to "service_role";

grant select on table "public"."day_itinerary_items" to "service_role";

grant trigger on table "public"."day_itinerary_items" to "service_role";

grant truncate on table "public"."day_itinerary_items" to "service_role";

grant update on table "public"."day_itinerary_items" to "service_role";

grant delete on table "public"."day_itinerary_notes" to "anon";

grant insert on table "public"."day_itinerary_notes" to "anon";

grant references on table "public"."day_itinerary_notes" to "anon";

grant select on table "public"."day_itinerary_notes" to "anon";

grant trigger on table "public"."day_itinerary_notes" to "anon";

grant truncate on table "public"."day_itinerary_notes" to "anon";

grant update on table "public"."day_itinerary_notes" to "anon";

grant delete on table "public"."day_itinerary_notes" to "authenticated";

grant insert on table "public"."day_itinerary_notes" to "authenticated";

grant references on table "public"."day_itinerary_notes" to "authenticated";

grant select on table "public"."day_itinerary_notes" to "authenticated";

grant trigger on table "public"."day_itinerary_notes" to "authenticated";

grant truncate on table "public"."day_itinerary_notes" to "authenticated";

grant update on table "public"."day_itinerary_notes" to "authenticated";

grant delete on table "public"."day_itinerary_notes" to "service_role";

grant insert on table "public"."day_itinerary_notes" to "service_role";

grant references on table "public"."day_itinerary_notes" to "service_role";

grant select on table "public"."day_itinerary_notes" to "service_role";

grant trigger on table "public"."day_itinerary_notes" to "service_role";

grant truncate on table "public"."day_itinerary_notes" to "service_role";

grant update on table "public"."day_itinerary_notes" to "service_role";

grant delete on table "public"."day_itinerary_transport_legs" to "anon";

grant insert on table "public"."day_itinerary_transport_legs" to "anon";

grant references on table "public"."day_itinerary_transport_legs" to "anon";

grant select on table "public"."day_itinerary_transport_legs" to "anon";

grant trigger on table "public"."day_itinerary_transport_legs" to "anon";

grant truncate on table "public"."day_itinerary_transport_legs" to "anon";

grant update on table "public"."day_itinerary_transport_legs" to "anon";

grant delete on table "public"."day_itinerary_transport_legs" to "authenticated";

grant insert on table "public"."day_itinerary_transport_legs" to "authenticated";

grant references on table "public"."day_itinerary_transport_legs" to "authenticated";

grant select on table "public"."day_itinerary_transport_legs" to "authenticated";

grant trigger on table "public"."day_itinerary_transport_legs" to "authenticated";

grant truncate on table "public"."day_itinerary_transport_legs" to "authenticated";

grant update on table "public"."day_itinerary_transport_legs" to "authenticated";

grant delete on table "public"."day_itinerary_transport_legs" to "service_role";

grant insert on table "public"."day_itinerary_transport_legs" to "service_role";

grant references on table "public"."day_itinerary_transport_legs" to "service_role";

grant select on table "public"."day_itinerary_transport_legs" to "service_role";

grant trigger on table "public"."day_itinerary_transport_legs" to "service_role";

grant truncate on table "public"."day_itinerary_transport_legs" to "service_role";

grant update on table "public"."day_itinerary_transport_legs" to "service_role";

grant delete on table "public"."destination_links" to "anon";

grant insert on table "public"."destination_links" to "anon";

grant references on table "public"."destination_links" to "anon";

grant select on table "public"."destination_links" to "anon";

grant trigger on table "public"."destination_links" to "anon";

grant truncate on table "public"."destination_links" to "anon";

grant update on table "public"."destination_links" to "anon";

grant delete on table "public"."destination_links" to "authenticated";

grant insert on table "public"."destination_links" to "authenticated";

grant references on table "public"."destination_links" to "authenticated";

grant select on table "public"."destination_links" to "authenticated";

grant trigger on table "public"."destination_links" to "authenticated";

grant truncate on table "public"."destination_links" to "authenticated";

grant update on table "public"."destination_links" to "authenticated";

grant delete on table "public"."destination_links" to "service_role";

grant insert on table "public"."destination_links" to "service_role";

grant references on table "public"."destination_links" to "service_role";

grant select on table "public"."destination_links" to "service_role";

grant trigger on table "public"."destination_links" to "service_role";

grant truncate on table "public"."destination_links" to "service_role";

grant update on table "public"."destination_links" to "service_role";

grant delete on table "public"."destinations" to "anon";

grant insert on table "public"."destinations" to "anon";

grant references on table "public"."destinations" to "anon";

grant select on table "public"."destinations" to "anon";

grant trigger on table "public"."destinations" to "anon";

grant truncate on table "public"."destinations" to "anon";

grant update on table "public"."destinations" to "anon";

grant delete on table "public"."destinations" to "authenticated";

grant insert on table "public"."destinations" to "authenticated";

grant references on table "public"."destinations" to "authenticated";

grant select on table "public"."destinations" to "authenticated";

grant trigger on table "public"."destinations" to "authenticated";

grant truncate on table "public"."destinations" to "authenticated";

grant update on table "public"."destinations" to "authenticated";

grant delete on table "public"."destinations" to "service_role";

grant insert on table "public"."destinations" to "service_role";

grant references on table "public"."destinations" to "service_role";

grant select on table "public"."destinations" to "service_role";

grant trigger on table "public"."destinations" to "service_role";

grant truncate on table "public"."destinations" to "service_role";

grant update on table "public"."destinations" to "service_role";

grant delete on table "public"."exchange_rates" to "anon";

grant insert on table "public"."exchange_rates" to "anon";

grant references on table "public"."exchange_rates" to "anon";

grant select on table "public"."exchange_rates" to "anon";

grant trigger on table "public"."exchange_rates" to "anon";

grant truncate on table "public"."exchange_rates" to "anon";

grant update on table "public"."exchange_rates" to "anon";

grant delete on table "public"."exchange_rates" to "authenticated";

grant insert on table "public"."exchange_rates" to "authenticated";

grant references on table "public"."exchange_rates" to "authenticated";

grant select on table "public"."exchange_rates" to "authenticated";

grant trigger on table "public"."exchange_rates" to "authenticated";

grant truncate on table "public"."exchange_rates" to "authenticated";

grant update on table "public"."exchange_rates" to "authenticated";

grant delete on table "public"."exchange_rates" to "service_role";

grant insert on table "public"."exchange_rates" to "service_role";

grant references on table "public"."exchange_rates" to "service_role";

grant select on table "public"."exchange_rates" to "service_role";

grant trigger on table "public"."exchange_rates" to "service_role";

grant truncate on table "public"."exchange_rates" to "service_role";

grant update on table "public"."exchange_rates" to "service_role";

grant delete on table "public"."experience_availability_rules" to "anon";

grant insert on table "public"."experience_availability_rules" to "anon";

grant references on table "public"."experience_availability_rules" to "anon";

grant select on table "public"."experience_availability_rules" to "anon";

grant trigger on table "public"."experience_availability_rules" to "anon";

grant truncate on table "public"."experience_availability_rules" to "anon";

grant update on table "public"."experience_availability_rules" to "anon";

grant delete on table "public"."experience_availability_rules" to "authenticated";

grant insert on table "public"."experience_availability_rules" to "authenticated";

grant references on table "public"."experience_availability_rules" to "authenticated";

grant select on table "public"."experience_availability_rules" to "authenticated";

grant trigger on table "public"."experience_availability_rules" to "authenticated";

grant truncate on table "public"."experience_availability_rules" to "authenticated";

grant update on table "public"."experience_availability_rules" to "authenticated";

grant delete on table "public"."experience_availability_rules" to "service_role";

grant insert on table "public"."experience_availability_rules" to "service_role";

grant references on table "public"."experience_availability_rules" to "service_role";

grant select on table "public"."experience_availability_rules" to "service_role";

grant trigger on table "public"."experience_availability_rules" to "service_role";

grant truncate on table "public"."experience_availability_rules" to "service_role";

grant update on table "public"."experience_availability_rules" to "service_role";

grant delete on table "public"."experience_exceptions" to "anon";

grant insert on table "public"."experience_exceptions" to "anon";

grant references on table "public"."experience_exceptions" to "anon";

grant select on table "public"."experience_exceptions" to "anon";

grant trigger on table "public"."experience_exceptions" to "anon";

grant truncate on table "public"."experience_exceptions" to "anon";

grant update on table "public"."experience_exceptions" to "anon";

grant delete on table "public"."experience_exceptions" to "authenticated";

grant insert on table "public"."experience_exceptions" to "authenticated";

grant references on table "public"."experience_exceptions" to "authenticated";

grant select on table "public"."experience_exceptions" to "authenticated";

grant trigger on table "public"."experience_exceptions" to "authenticated";

grant truncate on table "public"."experience_exceptions" to "authenticated";

grant update on table "public"."experience_exceptions" to "authenticated";

grant delete on table "public"."experience_exceptions" to "service_role";

grant insert on table "public"."experience_exceptions" to "service_role";

grant references on table "public"."experience_exceptions" to "service_role";

grant select on table "public"."experience_exceptions" to "service_role";

grant trigger on table "public"."experience_exceptions" to "service_role";

grant truncate on table "public"."experience_exceptions" to "service_role";

grant update on table "public"."experience_exceptions" to "service_role";

grant delete on table "public"."experiences" to "anon";

grant insert on table "public"."experiences" to "anon";

grant references on table "public"."experiences" to "anon";

grant select on table "public"."experiences" to "anon";

grant trigger on table "public"."experiences" to "anon";

grant truncate on table "public"."experiences" to "anon";

grant update on table "public"."experiences" to "anon";

grant delete on table "public"."experiences" to "authenticated";

grant insert on table "public"."experiences" to "authenticated";

grant references on table "public"."experiences" to "authenticated";

grant select on table "public"."experiences" to "authenticated";

grant trigger on table "public"."experiences" to "authenticated";

grant truncate on table "public"."experiences" to "authenticated";

grant update on table "public"."experiences" to "authenticated";

grant delete on table "public"."experiences" to "service_role";

grant insert on table "public"."experiences" to "service_role";

grant references on table "public"."experiences" to "service_role";

grant select on table "public"."experiences" to "service_role";

grant trigger on table "public"."experiences" to "service_role";

grant truncate on table "public"."experiences" to "service_role";

grant update on table "public"."experiences" to "service_role";

grant delete on table "public"."food_drink" to "anon";

grant insert on table "public"."food_drink" to "anon";

grant references on table "public"."food_drink" to "anon";

grant select on table "public"."food_drink" to "anon";

grant trigger on table "public"."food_drink" to "anon";

grant truncate on table "public"."food_drink" to "anon";

grant update on table "public"."food_drink" to "anon";

grant delete on table "public"."food_drink" to "authenticated";

grant insert on table "public"."food_drink" to "authenticated";

grant references on table "public"."food_drink" to "authenticated";

grant select on table "public"."food_drink" to "authenticated";

grant trigger on table "public"."food_drink" to "authenticated";

grant truncate on table "public"."food_drink" to "authenticated";

grant update on table "public"."food_drink" to "authenticated";

grant delete on table "public"."food_drink" to "service_role";

grant insert on table "public"."food_drink" to "service_role";

grant references on table "public"."food_drink" to "service_role";

grant select on table "public"."food_drink" to "service_role";

grant trigger on table "public"."food_drink" to "service_role";

grant truncate on table "public"."food_drink" to "service_role";

grant update on table "public"."food_drink" to "service_role";

grant delete on table "public"."hotels" to "anon";

grant insert on table "public"."hotels" to "anon";

grant references on table "public"."hotels" to "anon";

grant select on table "public"."hotels" to "anon";

grant trigger on table "public"."hotels" to "anon";

grant truncate on table "public"."hotels" to "anon";

grant update on table "public"."hotels" to "anon";

grant delete on table "public"."hotels" to "authenticated";

grant insert on table "public"."hotels" to "authenticated";

grant references on table "public"."hotels" to "authenticated";

grant select on table "public"."hotels" to "authenticated";

grant trigger on table "public"."hotels" to "authenticated";

grant truncate on table "public"."hotels" to "authenticated";

grant update on table "public"."hotels" to "authenticated";

grant delete on table "public"."hotels" to "service_role";

grant insert on table "public"."hotels" to "service_role";

grant references on table "public"."hotels" to "service_role";

grant select on table "public"."hotels" to "service_role";

grant trigger on table "public"."hotels" to "service_role";

grant truncate on table "public"."hotels" to "service_role";

grant update on table "public"."hotels" to "service_role";

grant delete on table "public"."itinerary_flights" to "anon";

grant insert on table "public"."itinerary_flights" to "anon";

grant references on table "public"."itinerary_flights" to "anon";

grant select on table "public"."itinerary_flights" to "anon";

grant trigger on table "public"."itinerary_flights" to "anon";

grant truncate on table "public"."itinerary_flights" to "anon";

grant update on table "public"."itinerary_flights" to "anon";

grant delete on table "public"."itinerary_flights" to "authenticated";

grant insert on table "public"."itinerary_flights" to "authenticated";

grant references on table "public"."itinerary_flights" to "authenticated";

grant select on table "public"."itinerary_flights" to "authenticated";

grant trigger on table "public"."itinerary_flights" to "authenticated";

grant truncate on table "public"."itinerary_flights" to "authenticated";

grant update on table "public"."itinerary_flights" to "authenticated";

grant delete on table "public"."itinerary_flights" to "service_role";

grant insert on table "public"."itinerary_flights" to "service_role";

grant references on table "public"."itinerary_flights" to "service_role";

grant select on table "public"."itinerary_flights" to "service_role";

grant trigger on table "public"."itinerary_flights" to "service_role";

grant truncate on table "public"."itinerary_flights" to "service_role";

grant update on table "public"."itinerary_flights" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."sight_admission_prices" to "anon";

grant insert on table "public"."sight_admission_prices" to "anon";

grant references on table "public"."sight_admission_prices" to "anon";

grant select on table "public"."sight_admission_prices" to "anon";

grant trigger on table "public"."sight_admission_prices" to "anon";

grant truncate on table "public"."sight_admission_prices" to "anon";

grant update on table "public"."sight_admission_prices" to "anon";

grant delete on table "public"."sight_admission_prices" to "authenticated";

grant insert on table "public"."sight_admission_prices" to "authenticated";

grant references on table "public"."sight_admission_prices" to "authenticated";

grant select on table "public"."sight_admission_prices" to "authenticated";

grant trigger on table "public"."sight_admission_prices" to "authenticated";

grant truncate on table "public"."sight_admission_prices" to "authenticated";

grant update on table "public"."sight_admission_prices" to "authenticated";

grant delete on table "public"."sight_admission_prices" to "service_role";

grant insert on table "public"."sight_admission_prices" to "service_role";

grant references on table "public"."sight_admission_prices" to "service_role";

grant select on table "public"."sight_admission_prices" to "service_role";

grant trigger on table "public"."sight_admission_prices" to "service_role";

grant truncate on table "public"."sight_admission_prices" to "service_role";

grant update on table "public"."sight_admission_prices" to "service_role";

grant delete on table "public"."sight_opening_exceptions" to "anon";

grant insert on table "public"."sight_opening_exceptions" to "anon";

grant references on table "public"."sight_opening_exceptions" to "anon";

grant select on table "public"."sight_opening_exceptions" to "anon";

grant trigger on table "public"."sight_opening_exceptions" to "anon";

grant truncate on table "public"."sight_opening_exceptions" to "anon";

grant update on table "public"."sight_opening_exceptions" to "anon";

grant delete on table "public"."sight_opening_exceptions" to "authenticated";

grant insert on table "public"."sight_opening_exceptions" to "authenticated";

grant references on table "public"."sight_opening_exceptions" to "authenticated";

grant select on table "public"."sight_opening_exceptions" to "authenticated";

grant trigger on table "public"."sight_opening_exceptions" to "authenticated";

grant truncate on table "public"."sight_opening_exceptions" to "authenticated";

grant update on table "public"."sight_opening_exceptions" to "authenticated";

grant delete on table "public"."sight_opening_exceptions" to "service_role";

grant insert on table "public"."sight_opening_exceptions" to "service_role";

grant references on table "public"."sight_opening_exceptions" to "service_role";

grant select on table "public"."sight_opening_exceptions" to "service_role";

grant trigger on table "public"."sight_opening_exceptions" to "service_role";

grant truncate on table "public"."sight_opening_exceptions" to "service_role";

grant update on table "public"."sight_opening_exceptions" to "service_role";

grant delete on table "public"."sight_opening_hours" to "anon";

grant insert on table "public"."sight_opening_hours" to "anon";

grant references on table "public"."sight_opening_hours" to "anon";

grant select on table "public"."sight_opening_hours" to "anon";

grant trigger on table "public"."sight_opening_hours" to "anon";

grant truncate on table "public"."sight_opening_hours" to "anon";

grant update on table "public"."sight_opening_hours" to "anon";

grant delete on table "public"."sight_opening_hours" to "authenticated";

grant insert on table "public"."sight_opening_hours" to "authenticated";

grant references on table "public"."sight_opening_hours" to "authenticated";

grant select on table "public"."sight_opening_hours" to "authenticated";

grant trigger on table "public"."sight_opening_hours" to "authenticated";

grant truncate on table "public"."sight_opening_hours" to "authenticated";

grant update on table "public"."sight_opening_hours" to "authenticated";

grant delete on table "public"."sight_opening_hours" to "service_role";

grant insert on table "public"."sight_opening_hours" to "service_role";

grant references on table "public"."sight_opening_hours" to "service_role";

grant select on table "public"."sight_opening_hours" to "service_role";

grant trigger on table "public"."sight_opening_hours" to "service_role";

grant truncate on table "public"."sight_opening_hours" to "service_role";

grant update on table "public"."sight_opening_hours" to "service_role";

grant delete on table "public"."sights" to "anon";

grant insert on table "public"."sights" to "anon";

grant references on table "public"."sights" to "anon";

grant select on table "public"."sights" to "anon";

grant trigger on table "public"."sights" to "anon";

grant truncate on table "public"."sights" to "anon";

grant update on table "public"."sights" to "anon";

grant delete on table "public"."sights" to "authenticated";

grant insert on table "public"."sights" to "authenticated";

grant references on table "public"."sights" to "authenticated";

grant select on table "public"."sights" to "authenticated";

grant trigger on table "public"."sights" to "authenticated";

grant truncate on table "public"."sights" to "authenticated";

grant update on table "public"."sights" to "authenticated";

grant delete on table "public"."sights" to "service_role";

grant insert on table "public"."sights" to "service_role";

grant references on table "public"."sights" to "service_role";

grant select on table "public"."sights" to "service_role";

grant trigger on table "public"."sights" to "service_role";

grant truncate on table "public"."sights" to "service_role";

grant update on table "public"."sights" to "service_role";

grant delete on table "public"."tour_availability_rules" to "anon";

grant insert on table "public"."tour_availability_rules" to "anon";

grant references on table "public"."tour_availability_rules" to "anon";

grant select on table "public"."tour_availability_rules" to "anon";

grant trigger on table "public"."tour_availability_rules" to "anon";

grant truncate on table "public"."tour_availability_rules" to "anon";

grant update on table "public"."tour_availability_rules" to "anon";

grant delete on table "public"."tour_availability_rules" to "authenticated";

grant insert on table "public"."tour_availability_rules" to "authenticated";

grant references on table "public"."tour_availability_rules" to "authenticated";

grant select on table "public"."tour_availability_rules" to "authenticated";

grant trigger on table "public"."tour_availability_rules" to "authenticated";

grant truncate on table "public"."tour_availability_rules" to "authenticated";

grant update on table "public"."tour_availability_rules" to "authenticated";

grant delete on table "public"."tour_availability_rules" to "service_role";

grant insert on table "public"."tour_availability_rules" to "service_role";

grant references on table "public"."tour_availability_rules" to "service_role";

grant select on table "public"."tour_availability_rules" to "service_role";

grant trigger on table "public"."tour_availability_rules" to "service_role";

grant truncate on table "public"."tour_availability_rules" to "service_role";

grant update on table "public"."tour_availability_rules" to "service_role";

grant delete on table "public"."tour_exceptions" to "anon";

grant insert on table "public"."tour_exceptions" to "anon";

grant references on table "public"."tour_exceptions" to "anon";

grant select on table "public"."tour_exceptions" to "anon";

grant trigger on table "public"."tour_exceptions" to "anon";

grant truncate on table "public"."tour_exceptions" to "anon";

grant update on table "public"."tour_exceptions" to "anon";

grant delete on table "public"."tour_exceptions" to "authenticated";

grant insert on table "public"."tour_exceptions" to "authenticated";

grant references on table "public"."tour_exceptions" to "authenticated";

grant select on table "public"."tour_exceptions" to "authenticated";

grant trigger on table "public"."tour_exceptions" to "authenticated";

grant truncate on table "public"."tour_exceptions" to "authenticated";

grant update on table "public"."tour_exceptions" to "authenticated";

grant delete on table "public"."tour_exceptions" to "service_role";

grant insert on table "public"."tour_exceptions" to "service_role";

grant references on table "public"."tour_exceptions" to "service_role";

grant select on table "public"."tour_exceptions" to "service_role";

grant trigger on table "public"."tour_exceptions" to "service_role";

grant truncate on table "public"."tour_exceptions" to "service_role";

grant update on table "public"."tour_exceptions" to "service_role";

grant delete on table "public"."tours" to "anon";

grant insert on table "public"."tours" to "anon";

grant references on table "public"."tours" to "anon";

grant select on table "public"."tours" to "anon";

grant trigger on table "public"."tours" to "anon";

grant truncate on table "public"."tours" to "anon";

grant update on table "public"."tours" to "anon";

grant delete on table "public"."tours" to "authenticated";

grant insert on table "public"."tours" to "authenticated";

grant references on table "public"."tours" to "authenticated";

grant select on table "public"."tours" to "authenticated";

grant trigger on table "public"."tours" to "authenticated";

grant truncate on table "public"."tours" to "authenticated";

grant update on table "public"."tours" to "authenticated";

grant delete on table "public"."tours" to "service_role";

grant insert on table "public"."tours" to "service_role";

grant references on table "public"."tours" to "service_role";

grant select on table "public"."tours" to "service_role";

grant trigger on table "public"."tours" to "service_role";

grant truncate on table "public"."tours" to "service_role";

grant update on table "public"."tours" to "service_role";

grant delete on table "public"."transport" to "anon";

grant insert on table "public"."transport" to "anon";

grant references on table "public"."transport" to "anon";

grant select on table "public"."transport" to "anon";

grant trigger on table "public"."transport" to "anon";

grant truncate on table "public"."transport" to "anon";

grant update on table "public"."transport" to "anon";

grant delete on table "public"."transport" to "authenticated";

grant insert on table "public"."transport" to "authenticated";

grant references on table "public"."transport" to "authenticated";

grant select on table "public"."transport" to "authenticated";

grant trigger on table "public"."transport" to "authenticated";

grant truncate on table "public"."transport" to "authenticated";

grant update on table "public"."transport" to "authenticated";

grant delete on table "public"."transport" to "service_role";

grant insert on table "public"."transport" to "service_role";

grant references on table "public"."transport" to "service_role";

grant select on table "public"."transport" to "service_role";

grant trigger on table "public"."transport" to "service_role";

grant truncate on table "public"."transport" to "service_role";

grant update on table "public"."transport" to "service_role";

grant delete on table "public"."transport_templates" to "anon";

grant insert on table "public"."transport_templates" to "anon";

grant references on table "public"."transport_templates" to "anon";

grant select on table "public"."transport_templates" to "anon";

grant trigger on table "public"."transport_templates" to "anon";

grant truncate on table "public"."transport_templates" to "anon";

grant update on table "public"."transport_templates" to "anon";

grant delete on table "public"."transport_templates" to "authenticated";

grant insert on table "public"."transport_templates" to "authenticated";

grant references on table "public"."transport_templates" to "authenticated";

grant select on table "public"."transport_templates" to "authenticated";

grant trigger on table "public"."transport_templates" to "authenticated";

grant truncate on table "public"."transport_templates" to "authenticated";

grant update on table "public"."transport_templates" to "authenticated";

grant delete on table "public"."transport_templates" to "service_role";

grant insert on table "public"."transport_templates" to "service_role";

grant references on table "public"."transport_templates" to "service_role";

grant select on table "public"."transport_templates" to "service_role";

grant trigger on table "public"."transport_templates" to "service_role";

grant truncate on table "public"."transport_templates" to "service_role";

grant update on table "public"."transport_templates" to "service_role";

grant delete on table "public"."trip_day_items" to "anon";

grant insert on table "public"."trip_day_items" to "anon";

grant references on table "public"."trip_day_items" to "anon";

grant select on table "public"."trip_day_items" to "anon";

grant trigger on table "public"."trip_day_items" to "anon";

grant truncate on table "public"."trip_day_items" to "anon";

grant update on table "public"."trip_day_items" to "anon";

grant delete on table "public"."trip_day_items" to "authenticated";

grant insert on table "public"."trip_day_items" to "authenticated";

grant references on table "public"."trip_day_items" to "authenticated";

grant select on table "public"."trip_day_items" to "authenticated";

grant trigger on table "public"."trip_day_items" to "authenticated";

grant truncate on table "public"."trip_day_items" to "authenticated";

grant update on table "public"."trip_day_items" to "authenticated";

grant delete on table "public"."trip_day_items" to "service_role";

grant insert on table "public"."trip_day_items" to "service_role";

grant references on table "public"."trip_day_items" to "service_role";

grant select on table "public"."trip_day_items" to "service_role";

grant trigger on table "public"."trip_day_items" to "service_role";

grant truncate on table "public"."trip_day_items" to "service_role";

grant update on table "public"."trip_day_items" to "service_role";

grant delete on table "public"."trip_days" to "anon";

grant insert on table "public"."trip_days" to "anon";

grant references on table "public"."trip_days" to "anon";

grant select on table "public"."trip_days" to "anon";

grant trigger on table "public"."trip_days" to "anon";

grant truncate on table "public"."trip_days" to "anon";

grant update on table "public"."trip_days" to "anon";

grant delete on table "public"."trip_days" to "authenticated";

grant insert on table "public"."trip_days" to "authenticated";

grant references on table "public"."trip_days" to "authenticated";

grant select on table "public"."trip_days" to "authenticated";

grant trigger on table "public"."trip_days" to "authenticated";

grant truncate on table "public"."trip_days" to "authenticated";

grant update on table "public"."trip_days" to "authenticated";

grant delete on table "public"."trip_days" to "service_role";

grant insert on table "public"."trip_days" to "service_role";

grant references on table "public"."trip_days" to "service_role";

grant select on table "public"."trip_days" to "service_role";

grant trigger on table "public"."trip_days" to "service_role";

grant truncate on table "public"."trip_days" to "service_role";

grant update on table "public"."trip_days" to "service_role";

grant delete on table "public"."trips" to "anon";

grant insert on table "public"."trips" to "anon";

grant references on table "public"."trips" to "anon";

grant select on table "public"."trips" to "anon";

grant trigger on table "public"."trips" to "anon";

grant truncate on table "public"."trips" to "anon";

grant update on table "public"."trips" to "anon";

grant delete on table "public"."trips" to "authenticated";

grant insert on table "public"."trips" to "authenticated";

grant references on table "public"."trips" to "authenticated";

grant select on table "public"."trips" to "authenticated";

grant trigger on table "public"."trips" to "authenticated";

grant truncate on table "public"."trips" to "authenticated";

grant update on table "public"."trips" to "authenticated";

grant delete on table "public"."trips" to "service_role";

grant insert on table "public"."trips" to "service_role";

grant references on table "public"."trips" to "service_role";

grant select on table "public"."trips" to "service_role";

grant trigger on table "public"."trips" to "service_role";

grant truncate on table "public"."trips" to "service_role";

grant update on table "public"."trips" to "service_role";

grant delete on table "public"."user_roles" to "anon";

grant insert on table "public"."user_roles" to "anon";

grant references on table "public"."user_roles" to "anon";

grant select on table "public"."user_roles" to "anon";

grant trigger on table "public"."user_roles" to "anon";

grant truncate on table "public"."user_roles" to "anon";

grant update on table "public"."user_roles" to "anon";

grant delete on table "public"."user_roles" to "authenticated";

grant insert on table "public"."user_roles" to "authenticated";

grant references on table "public"."user_roles" to "authenticated";

grant select on table "public"."user_roles" to "authenticated";

grant trigger on table "public"."user_roles" to "authenticated";

grant truncate on table "public"."user_roles" to "authenticated";

grant update on table "public"."user_roles" to "authenticated";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";


