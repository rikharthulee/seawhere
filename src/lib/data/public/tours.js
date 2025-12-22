import { getPublicDB } from "@/lib/supabase/public";
import { TOUR_PUBLIC_COLUMNS } from "@/lib/data/public/selects";
import { getDestinationBySlugsPublic } from "@/lib/data/public/destinations";

function isUUID(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(v || "").trim()
  );
}

export async function listPublishedTours() {
  const db = getPublicDB();
  const { data, error } = await db
    .from("tours")
    .select(
      "id, slug, name, summary, images, destination_id, country_id, status, destinations ( slug, countries ( slug ) )"
    )
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listToursByDestinationSlug(destinationSlug) {
  const db = getPublicDB();
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name, country_id, countries ( slug )")
    .eq("slug", String(destinationSlug || "").trim())
    .maybeSingle();
  if (!dst?.id) return { destination: null, tours: [] };
  const { data, error } = await db
    .from("tours")
    .select(
      "id, slug, name, summary, images, destination_id, country_id, status, destinations ( slug, countries ( slug ) )"
    )
    .eq("destination_id", dst.id)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return { destination: dst, tours: data ?? [] };
}

export async function listToursByDestinationId(destinationId) {
  if (!destinationId) return [];
  const db = getPublicDB();
  const { data, error } = await db
    .from("tours")
    .select("id, slug, name, summary, images, destination_id, country_id, status")
    .eq("destination_id", destinationId)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getTourBySlugPublic(slug) {
  const db = getPublicDB();
  const normalized = String(slug || "").trim();
  if (!normalized) {
    console.warn("[public:tours] invalid slug", { slug });
    return { tour: null, destination: null };
  }

  const { data, error, status } = await db
    .from("tours")
    .select(
      `${TOUR_PUBLIC_COLUMNS}, destinations ( id, slug, name, country_id, countries ( slug ) )`
    )
    .eq("slug", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[public:tours] select failed", {
      table: "tours",
      status,
      msg: error.message,
    });
    return { tour: null, destination: null };
  }

  if (!data) {
    console.warn("[public:tours] entity not visible", {
      table: "tours",
      slug: normalized,
    });
    return { tour: null, destination: null };
  }

  const { destinations: destination, ...tour } = data;
  return { tour, destination: destination || null };
}

export async function getTourByIdPublic(id) {
  const db = getPublicDB();
  const normalized = String(id || "").trim();
  if (!isUUID(normalized)) {
    console.warn("[public:tours] invalid id", { id });
    return { tour: null, destination: null };
  }

  const { data, error, status } = await db
    .from("tours")
    .select(
      `${TOUR_PUBLIC_COLUMNS}, destinations ( id, slug, name, country_id, countries ( slug ) )`
    )
    .eq("id", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[public:tours] select failed", {
      table: "tours",
      status,
      msg: error.message,
    });
    return { tour: null, destination: null };
  }

  if (!data) {
    console.warn("[public:tours] entity not visible", {
      table: "tours",
      id: normalized,
    });
    return { tour: null, destination: null };
  }

  const { destinations: destination, ...tour } = data;
  return { tour, destination: destination || null };
}

export async function getTourBySlugsPublic(destinationSlug, tourSlug) {
  const db = getPublicDB();
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name, country_id, countries ( slug )")
    .eq("slug", String(destinationSlug || "").trim())
    .maybeSingle();
  if (!dst?.id) return { tour: null, destination: null };
  const { data, error } = await db
    .from("tours")
    .select(
      `${TOUR_PUBLIC_COLUMNS}, destinations ( id, slug, name, country_id, countries ( slug ) )`
    )
    .eq("destination_id", dst.id)
    .eq("slug", String(tourSlug || "").trim())
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return { tour: null, destination: dst };
  const { destinations: destination, ...tour } = data;
  return { tour, destination: destination || dst };
}

export async function getTourByDestinationSlugsPublic({
  countrySlug,
  destinationSlug,
  tourSlug,
}) {
  const destination = await getDestinationBySlugsPublic(
    countrySlug,
    destinationSlug
  );
  if (!destination?.id || !tourSlug) {
    return { tour: null, destination: null };
  }

  const db = getPublicDB();
  const { data, error } = await db
    .from("tours")
    .select(
      `${TOUR_PUBLIC_COLUMNS}, destinations ( id, slug, name, country_id, countries ( slug, name ) )`
    )
    .eq("destination_id", destination.id)
    .eq("slug", String(tourSlug || "").trim())
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) {
    return { tour: null, destination };
  }
  const { destinations: destinationData, ...tour } = data;
  return { tour, destination: destinationData || destination };
}
