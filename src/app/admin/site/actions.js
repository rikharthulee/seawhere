"use server";

import { getDB } from "@/lib/supabase/server";

const SITE_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export async function saveSiteSettings(payload) {
  const db = await getDB();
  const headline =
    typeof payload?.hero_headline === "string"
      ? payload.hero_headline.trim()
      : "";
  const tagline =
    typeof payload?.hero_tagline === "string"
      ? payload.hero_tagline.trim()
      : "";
  const images = Array.isArray(payload?.hero_images)
    ? payload.hero_images
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
    : [];

  const { data, error } = await db
    .from("site_settings")
    .upsert({
      id: SITE_SETTINGS_ID,
      hero_headline: headline || null,
      hero_tagline: tagline || null,
      hero_images: images,
      updated_at: new Date().toISOString(),
    })
    .select("id, hero_headline, hero_tagline, hero_images")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
