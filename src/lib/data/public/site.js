import { getPublicDB } from "@/lib/supabase/public";

export async function fetchHeroSettings() {
  const db = getPublicDB();
  const { data } = await db
    .from("site_settings")
    .select("hero_headline, hero_tagline, hero_images, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}
