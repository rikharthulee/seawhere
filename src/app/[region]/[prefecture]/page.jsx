import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchRegionBySlug,
  fetchPrefectureBySlug,
  fetchDivisionsByPrefecture,
  fetchDestinationsByPrefecture,
} from "@/lib/supabaseRest";
import { resolveImageUrl } from "@/lib/imageUrl";

export default async function PrefecturePage({ params }) {
  const { region, prefecture } = await params;

  const reg = await fetchRegionBySlug(region).catch(() => null);
  if (!reg) notFound();
  const pref = await fetchPrefectureBySlug(prefecture, reg.id).catch(() => null);
  if (!pref) notFound();

  const divisions = (await fetchDivisionsByPrefecture(pref.id).catch(() => [])) || [];
  const allPrefDests = await fetchDestinationsByPrefecture(pref.id).catch(() => []);
  const unassignedDests = Array.isArray(allPrefDests)
    ? allPrefDests.filter((d) => !d.division_id)
    : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-black/60 mb-4">
        <Link href="/regions" className="underline">Regions</Link>
        <span> / </span>
        <span>{reg.name}</span>
        <span> / </span>
        <span className="text-black">{pref.name}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl md:text-4xl font-medium">{pref.name}</h1>
        <Link href={`/sights/prefecture/${pref.slug}`} className="underline">Sights in {pref.name}</Link>
      </div>

      {divisions.length > 0 ? (
        <>
          <section className="space-y-6">
            {divisions.map((d) => (
              <div key={d.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{d.name}</h2>
                  <Link href={`/${reg.slug}/${pref.slug}/${d.slug}`} className="underline">
                    View all
                  </Link>
                </div>
              </div>
            ))}
          </section>
          {unassignedDests.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-xl font-semibold mb-3">Other destinations in {pref.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {unassignedDests.map((dst) => (
                  <Link
                    key={dst.id}
                    href={`/destinations/${dst.slug}`}
                    className="block rounded-lg border overflow-hidden hover:shadow-sm"
                  >
                    <div className="aspect-[4/3] bg-black/5" style={{backgroundImage: dst.thumbnail_image ? `url(${resolveImageUrl(dst.thumbnail_image)})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center'}} />
                    <div className="p-3">
                      <div className="font-medium">{dst.name}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {unassignedDests.map((dst) => (
            <Link
              key={dst.id}
              href={`/destinations/${dst.slug}`}
              className="block rounded-lg border overflow-hidden hover:shadow-sm"
            >
              <div className="aspect-[4/3] bg-black/5" style={{backgroundImage: dst.thumbnail_image ? `url(${resolveImageUrl(dst.thumbnail_image)})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center'}} />
              <div className="p-3">
                <div className="font-medium">{dst.name}</div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}

export const revalidate = 300;
