import ExcursionsGallery from "@/components/ExcursionsGallery";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const revalidate = 300;

async function getPublishedExcursions() {
  const supabase = getServiceSupabase();
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
    if (error.code === "42703") {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("excursions")
        .select(selectWithoutSlug)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(60);
      if (fallbackError) throw fallbackError;
      return fallbackData || [];
    }
    throw error;
  }

  return data || [];
}

export default async function ExcursionsPage() {
  const rows = await getPublishedExcursions();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <ExcursionsGallery rows={rows} />
    </main>
  );
}
