import ExcursionsGallery from "@/components/ExcursionsGallery";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 300;

async function getPublishedExcursions() {
  try {
    const supabase = createServerClient();
    const selectWithSlug =
      "id, slug, name, description, summary, transport, maps_url, updated_at, status";
    const selectWithoutSlug =
      "id, name, description, summary, transport, maps_url, updated_at, status";

    const { data, error } = await supabase
      .from("excursions")
      .select(selectWithSlug)
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(60);

    if (error) {
      // Fallback if `slug` column doesn’t exist in some envs
      if (error.code === "42703") {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("excursions")
          .select(selectWithoutSlug)
          .eq("status", "published")
          .order("updated_at", { ascending: false })
          .limit(60);
        if (fallbackError) {
          console.error(
            "getPublishedExcursions fallback error:",
            fallbackError.message
          );
          return [];
        }
        return fallbackData || [];
      }
      console.error("getPublishedExcursions error:", error.message);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error("getPublishedExcursions exception:", e);
    return [];
  }
}

export default async function ExcursionsPage() {
  const rows = await getPublishedExcursions();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <ExcursionsGallery rows={rows} />
    </main>
  );
}
