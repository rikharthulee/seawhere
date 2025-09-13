import Sights from "@/components/Sights";
import { createClient } from "@supabase/supabase-js";

export default async function SightsPage() {
  let items = [];
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const db = createClient(url, key);
    const { data: sights, error } = await db
      .from("sights")
      .select("id, slug, name, summary, images, destination_id, status, deeplink, provider, gyg_id")
      .eq("status", "published")
      .order("name", { ascending: true });
    if (!error && sights) {
      const ids = Array.from(new Set(sights.map((x) => x.destination_id).filter(Boolean)));
      let destMap = {};
      if (ids.length > 0) {
        const { data: dests } = await db
          .from("destinations")
          .select("id, slug, name")
          .in("id", ids);
        destMap = Object.fromEntries((dests || []).map((d) => [d.id, d]));
      }
      items = sights.map((x) => ({ ...x, destinations: destMap[x.destination_id] || null }));
    }
  } catch {}
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Sights items={items} />
    </main>
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
