import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import EmblaCarousel from "@/components/EmblaCarousel";
import RichText from "@/components/RichText";
import {
  fetchDestinationBySlug,
  fetchPrefectureById,
  fetchDivisionById,
  fetchRegionById,
  fetchPOIsByDestination,
  fetchAccommodationByDestination,
  fetchArticlesByDestination,
  fetchDestinationLinksFrom,
  fetchDestinationsByIds,
} from "@/lib/supabaseRest";
import { resolveImageUrl } from "@/lib/imageUrl";

export async function generateStaticParams() {
  // Optional: leave empty for now; destination pages will ISR
  return [];
}

export default async function DestinationPage({ params }) {
  const { slug } = await params;
  const dst = await fetchDestinationBySlug(slug).catch(() => null);
  if (!dst) notFound();

  const [pref, div, pois, stays, articles, links] = await Promise.all([
    dst.prefecture_id ? fetchPrefectureById(dst.prefecture_id).catch(() => null) : Promise.resolve(null),
    dst.division_id ? fetchDivisionById(dst.division_id).catch(() => null) : Promise.resolve(null),
    fetchPOIsByDestination(dst.id).catch(() => []),
    fetchAccommodationByDestination(dst.id).catch(() => []),
    fetchArticlesByDestination(dst.id).catch(() => []),
    fetchDestinationLinksFrom(dst.id).catch(() => []),
  ]);
  const region = pref?.region_id ? await fetchRegionById(pref.region_id).catch(() => null) : null;
  const linkDestIds = (links || []).map((l) => l.to_location_id);
  const linkDests = await fetchDestinationsByIds(linkDestIds).catch(() => []);
  const linkMap = new Map(linkDests.map((d) => [d.id, d]));

  const images = Array.isArray(dst.images) ? dst.images : [];
  const hero = resolveImageUrl(dst.hero_image || dst.thumbnail_image);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-black/60 mb-4">
        <Link href="/regions" className="underline">Regions</Link>
        {region ? (
          <>
            <span> / </span>
            <Link href={`/${region.slug}/${pref.slug}`} className="underline">{region.name}</Link>
          </>
        ) : null}
        {pref ? (
          <>
            <span> / </span>
            <span className="underline">{pref.name}</span>
          </>
        ) : null}
        {div ? (
          <>
            <span> / </span>
            <Link href={`/${region?.slug || ""}/${pref?.slug || ""}/${div.slug}`} className="underline">{div.name}</Link>
          </>
        ) : null}
        <span> / </span>
        <span className="text-black">{dst.name}</span>
      </nav>

      {/* Header */}
      <div className="border-t-2 border-black/10 pt-4">
        <h1 className="text-3xl md:text-4xl font-medium">{dst.name}</h1>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <div className="order-1 md:order-2">
          {images.length > 0 ? (
            <EmblaCarousel
              images={images}
              options={{ loop: true, align: "start" }}
              className="rounded-xl overflow-hidden"
              slideClass="h-[48vh] min-h-[320px]"
            />
          ) : hero ? (
            <Image
              src={hero}
              alt={dst.name}
              width={1200}
              height={800}
              className="w-full h-auto rounded-xl object-cover"
              priority={false}
            />
          ) : null}
        </div>
        {dst.credit ? (
          <p className="mt-2 text-xs text-gray-500 text-right order-3 md:order-3">{dst.credit}</p>
        ) : null}
        <div className="order-2 md:order-1">
          <RichText value={dst.body_richtext || dst.summary} />
        </div>
      </section>

      {/* Sections: basic placeholders for now */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-3">Top sights & experiences</h2>
        {pois.length === 0 ? (
          <p className="text-black/60">No POIs yet.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pois.map((p) => (
              <li key={p.id} className="rounded border p-3">
                <div className="text-sm uppercase text-black/50">{p.type}</div>
                <div className="font-medium">{p.title}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-3">Where to stay</h2>
        {stays.length === 0 ? (
          <p className="text-black/60">No accommodation yet.</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stays.map((a) => (
              <li key={a.id} className="rounded border p-3">
                <div className="font-medium">{a.name}</div>
                <div className="text-black/60 text-sm">{a.summary}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-3">Articles</h2>
        {articles.length === 0 ? (
          <p className="text-black/60">No articles yet.</p>
        ) : (
          <ul className="space-y-2">
            {articles.map((ar) => (
              <li key={ar.id} className="rounded border p-3">
                <div className="font-medium">{ar.title}</div>
                <div className="text-black/60 text-sm">{ar.excerpt}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-3">Nearby / Day trips</h2>
        {links.length === 0 ? (
          <p className="text-black/60">No links yet.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {links.map((l) => {
              const to = linkMap.get(l.to_location_id);
              return to ? (
                <Link href={`/destinations/${to.slug}`} key={`${l.to_location_id}:${l.relation}`} className="min-w-[12rem] rounded border p-3 hover:shadow-sm">
                  <div className="text-xs uppercase text-black/50">{l.relation.replace("_"," ")}</div>
                  <div className="font-medium">{to.name}</div>
                </Link>
              ) : null;
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export const revalidate = 300;
