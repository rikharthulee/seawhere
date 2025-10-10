import Link from "next/link";
import { listRegionsPublic, listPrefecturesPublic } from "@/lib/data/public/geo";

export default async function RegionsPage() {
  const regions = await listRegionsPublic();
  const prefectures = await listPrefecturesPublic();

  const prefByRegion = new Map();
  for (const p of prefectures) {
    if (!prefByRegion.has(p.region_id)) prefByRegion.set(p.region_id, []);
    prefByRegion.get(p.region_id).push(p);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-medium mb-6">Regions</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {regions.map((r) => {
          const prefs = (prefByRegion.get(r.id) || []).sort(
            (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
          );
          return (
            <div key={r.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-semibold">{r.name}</div>
                <Link href={`/sights/region/${r.slug}`} className="underline text-sm">Sights</Link>
              </div>
              {prefs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {prefs.map((p) => (
                    <Link
                      key={p.id}
                      href={`/${r.slug}/${p.slug}`}
                      className="inline-block rounded-full border px-3 py-1 text-sm hover:bg-black/5"
                    >
                      {p.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-black/60">No prefectures</div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}

export const revalidate = 86400;
export const runtime = 'nodejs';
