import { getDB } from "@/lib/supabase/server";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import { saveSiteSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  const db = await getDB();
  const { data: settings } = await db
    .from("site_settings")
    .select("id, hero_headline, hero_tagline, hero_images, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">Site Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Control the homepage hero content without touching code.
        </p>
      </div>
      <SiteSettingsForm initial={settings} onSave={saveSiteSettings} />
    </main>
  );
}
