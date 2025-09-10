import accommodation from "@/data/accommodation";
import { notFound } from "next/navigation";
import EmblaCarousel from "@/components/EmblaCarousel";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import RichText from "@/components/RichText";
import { resolveImageUrl } from "@/lib/imageUrl";
import {
  fetchAccommodations,
  fetchAccommodationBySlug,
  fetchDestinationById,
  fetchPrefectureById,
  fetchDivisionById,
} from "@/lib/supabaseRest";

export async function generateStaticParams() {
  try {
    const rows = await fetchAccommodations();
    return rows.map((a) => ({ slug: a.slug }));
  } catch {
    return accommodation.map((a) => ({ slug: a.slug }));
  }
}

export default async function AccommodationDetailPage({ params }) {
  const { slug } = await params;
  let item = null;
  try {
    const row = await fetchAccommodationBySlug(slug);
    if (row) {
      const gallery = Array.isArray(row.images) ? row.images : [];
      // Fetch related geo labels in parallel (best-effort)
      const [dest, pref, div] = await Promise.all([
        fetchDestinationById(row.destination_id).catch(() => null),
        fetchPrefectureById(row.prefecture_id).catch(() => null),
        fetchDivisionById(row.division_id).catch(() => null),
      ]);
      item = {
        title: row.name,
        image: resolveImageUrl(row.hero_image || row.thumbnail_image),
        images: gallery.map((k) => resolveImageUrl(k)).filter(Boolean),
        details: row.description || row.summary,
        credit: row.credit || null,
        // New fields
        priceBand: row.price_band || null,
        rating: typeof row.rating === "number" ? row.rating : row.rating ? Number(row.rating) : null,
        websiteUrl: row.website_url || null,
        affiliateUrl: row.affiliate_url || null,
        lat: row.lat ?? null,
        lng: row.lng ?? null,
        address: row.address || null,
        destination: dest,
        prefecture: pref,
        division: div,
      };
    }
  } catch {}
  if (!item) {
    item = accommodation.find((a) => a.slug === slug);
  }

  if (!item) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-black/10 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            {item.title}
          </h1>
          <Link href="/accommodation" className="underline ml-4">
            Back
          </Link>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <div className="order-1 md:order-2">
          {Array.isArray(item.images) && item.images.length > 0 ? (
            <EmblaCarousel
              images={item.images}
              options={{ loop: true, align: "start" }}
              className="rounded-xl overflow-hidden"
              slideClass="h-[48vh] min-h-[320px]"
            />
          ) : (
            <SafeImage
              src={item.image}
              alt={item.title}
              width={1200}
              height={800}
              className="w-full h-auto rounded-xl object-cover"
            />
          )}
        </div>

        {/* Caption under image */}
        {item.credit ? (
          <p className="mt-2 text-xs text-gray-500 text-right order-3 md:order-3">
            {item.credit}
          </p>
        ) : null}

        <div className="order-2 md:order-1">
          <RichText value={item.details} />
        </div>
      </section>

      {/* Quick facts */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-black/80">
        <div className="rounded border p-3 space-y-1">
          <div className="font-medium text-black">Overview</div>
          {item.priceBand ? (
            <div><span className="text-black/70">Price band:</span> {item.priceBand}</div>
          ) : null}
          {typeof item.rating === 'number' ? (
            <div><span className="text-black/70">Rating:</span> {item.rating.toFixed(1)} / 5</div>
          ) : null}
          {(item.lat ?? item.lng) ? (
            <div><span className="text-black/70">Lat/Lng:</span> {item.lat ?? "—"}, {item.lng ?? "—"}</div>
          ) : null}
        </div>
        <div className="rounded border p-3 space-y-1">
          <div className="font-medium text-black">Location</div>
          {item.destination ? (
            <div>
              <span className="text-black/70">Destination:</span>{' '}
              <Link className="underline" href={`/destinations/${item.destination.slug}`}>{item.destination.name}</Link>
            </div>
          ) : null}
          {item.prefecture ? (
            <div><span className="text-black/70">Prefecture:</span> {item.prefecture.name}</div>
          ) : null}
          {item.division ? (
            <div><span className="text-black/70">Division:</span> {item.division.name}</div>
          ) : null}
        </div>
        <div className="rounded border p-3 space-y-2">
          <div className="font-medium text-black">Links</div>
          <div className="flex flex-wrap gap-2">
            {item.websiteUrl ? (
              <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer" className="rounded border px-3 py-1">Website</a>
            ) : null}
            {item.affiliateUrl ? (
              <a href={item.affiliateUrl} target="_blank" rel="noopener noreferrer" className="rounded bg-blue-600 text-white px-3 py-1">Book</a>
            ) : null}
          </div>
        </div>
      </section>

      {item.address ? (
        <section className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Address</h2>
          <pre className="rounded border bg-black/5 p-3 text-xs overflow-auto">{typeof item.address === 'string' ? item.address : JSON.stringify(item.address, null, 2)}</pre>
        </section>
      ) : null}
    </main>
  );
}
export const revalidate = 900;
