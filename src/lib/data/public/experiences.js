import { getPublicDB } from "@/lib/supabase/public";
import { EXPERIENCE_PUBLIC_COLUMNS } from "@/lib/data/public/selects";

function isUUID(v) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(v || "").trim()
  );
}

export async function listPublishedExperiences() {
  const db = getPublicDB();
  const { data, error } = await db
    .from("experiences")
    .select("id, slug, name, summary, images, destination_id, country_id, status")
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listExperiencesByDestinationSlug(destSlug) {
  const db = getPublicDB();
  const { data: dst, error: e1 } = await db
    .from("destinations")
    .select("id, slug, name, country_id")
    .eq("slug", String(destSlug || "").trim())
    .maybeSingle();
  if (e1 || !dst?.id) return { destination: null, experiences: [] };
  const { data, error } = await db
    .from("experiences")
    .select("id, slug, name, summary, images, destination_id, country_id, status, destinations ( slug )")
    .eq("destination_id", dst.id)
    .eq("status", "published")
    .order("name", { ascending: true });
  if (error) throw error;
  return { destination: dst, experiences: data ?? [] };
}

export async function getExperienceBySlugPublic(slug) {
  const db = getPublicDB();
  const normalized = String(slug || "").trim();
  if (!normalized) {
    console.warn("[public:experiences] invalid slug", { slug });
    return { experience: null, destination: null };
  }

  const { data, error, status } = await db
    .from("experiences")
    .select(
      `${EXPERIENCE_PUBLIC_COLUMNS}, destinations ( id, slug, name, country_id, countries ( slug ) )`
    )
    .eq("slug", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[public:experiences] select failed", {
      table: "experiences",
      status,
      msg: error.message,
    });
    return { experience: null, destination: null };
  }

  if (!data) {
    console.warn("[public:experiences] entity not visible", {
      table: "experiences",
      slug: normalized,
    });
    return { experience: null, destination: null };
  }

  const { destinations: destination, ...experience } = data;
  return { experience, destination: destination || null };
}

export async function getExperienceByIdPublic(id) {
  const db = getPublicDB();
  const normalized = String(id || "").trim();
  if (!isUUID(normalized)) {
    console.warn("[public:experiences] invalid id", { id });
    return { experience: null, destination: null };
  }

  const { data, error, status } = await db
    .from("experiences")
    .select(
      `${EXPERIENCE_PUBLIC_COLUMNS}, destinations ( id, slug, name, country_id, countries ( slug ) )`
    )
    .eq("id", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[public:experiences] select failed", {
      table: "experiences",
      status,
      msg: error.message,
    });
    return { experience: null, destination: null };
  }

  if (!data) {
    console.warn("[public:experiences] entity not visible", {
      table: "experiences",
      id: normalized,
    });
    return { experience: null, destination: null };
  }

  const { destinations: destination, ...experience } = data;
  return { experience, destination: destination || null };
}

export async function getExperienceBySlugsPublic(destinationSlug, experienceSlug) {
  const db = getPublicDB();
  const { data: dst } = await db
    .from("destinations")
    .select("id, slug, name, country_id, countries ( slug )")
    .eq("slug", String(destinationSlug || "").trim())
    .maybeSingle();
  if (!dst?.id) return { experience: null, destination: null };
  const { data, error } = await db
    .from("experiences")
    .select(
      `${EXPERIENCE_PUBLIC_COLUMNS}, destinations ( id, slug, name, country_id, countries ( slug ) )`
    )
    .eq("destination_id", dst.id)
    .eq("slug", String(experienceSlug || "").trim())
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return { experience: null, destination: dst };
  const { destinations: destination, ...experience } = data;
  return { experience, destination: destination || dst };
}
