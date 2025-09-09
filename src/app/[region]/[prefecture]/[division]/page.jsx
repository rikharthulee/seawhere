import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchRegionBySlug,
  fetchPrefectureBySlug,
  fetchDivisionBySlug,
  fetchDestinationsByDivision,
} from "@/lib/supabaseRest";
import { resolveImageUrl } from "@/lib/imageUrl";

export default async function DivisionPage({ params }) {
  const { region, prefecture, division } = await params;

  const reg = await fetchRegionBySlug(region).catch(() => null);
  if (!reg) notFound();
  const pref = await fetchPrefectureBySlug(prefecture, reg.id).catch(() => null);
  if (!pref) notFound();
  const div = await fetchDivisionBySlug(division, pref.id).catch(() => null);
  if (!div) notFound();

  const destinations = await fetchDestinationsByDivision(div.id).catch(() => []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-black/60 mb-4">
        <Link href="/regions" className="underline">Regions</Link>
        <span> / </span>
        <Link href={`/${reg.slug}/${pref.slug}`} className="underline">{reg.name}</Link>
        <span> / </span>
        <span className="text-black">{pref.name} — {div.name}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-medium mb-6">{div.name}</h1>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {destinations.map((dst) => (
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
    </main>
  );
}

export const revalidate = 300;
