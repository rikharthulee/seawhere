import { notFound } from "next/navigation";
import { getDestinationBySlugLoose } from "@/lib/data/destinations";
import { getSightsForDestination } from "@/lib/data/sights";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/imageUrl";
import GygWidget from "@/components/GygWidget";

export const revalidate = 300;
export const runtime = 'nodejs';

export default async function SightsByDestinationPage({ params }) {
  const { slug } = await params;
  let dst = await getDestinationBySlugLoose(slug).catch(() => null);
  if (!dst) notFound();
  const sights = await getSightsForDestination(dst.id).catch(() => []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-black/10 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            Sights in {dst.name}
          </h1>
          <Link href="/sights" className="underline ml-4">
            Back
          </Link>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.isArray(sights) && sights.length > 0 ? (
          sights.map((p) => {
            let imgPath = p.image || null;
            if (!imgPath && p.images) {
              if (Array.isArray(p.images) && p.images.length > 0) {
                const first = p.images[0];
                imgPath = (first && (first.url || first.src)) || (typeof first === 'string' ? first : null);
              } else if (typeof p.images === 'string') {
                imgPath = p.images;
              }
            }
            const img = resolveImageUrl(imgPath);
            const canLink = !!p.slug;
            const CardTag = canLink ? Link : 'div';
            const cardProps = canLink ? { href: `/sights/${encodeURIComponent(dst.slug)}/${encodeURIComponent(p.slug)}` } : {};
            return (
              <CardTag
                key={p.id}
                {...cardProps}
                className="block rounded-lg border overflow-hidden focus:outline-none focus:ring-2 focus:ring-black/40"
              >
                <div className="aspect-[4/3] relative bg-black/5">
                  {img ? (
                    <SafeImage
                      src={img}
                      alt={p.title || p.name}
                      fill
                      sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <div className="font-medium">{p.title || p.name}</div>
                  {p.summary ? (
                    <p className="text-sm text-black/70 mt-1 line-clamp-3">{p.summary}</p>
                  ) : null}
                </div>
              </CardTag>
            );
          })
        ) : (
          <div className="col-span-full text-black/60">No sights yet for this destination.</div>
        )}
      </section>

      {/* Tours widget (GetYourGuide) */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-2">Popular tours</h2>
        <GygWidget />
      </section>
    </main>
  );
}
