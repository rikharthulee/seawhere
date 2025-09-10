import { notFound } from "next/navigation";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { resolveImageUrl } from "@/lib/imageUrl";
import { fetchDivisionBySlugLoose, fetchDestinationsByDivision, fetchPOIsByDestinationIds } from "@/lib/supabaseRest";

export const revalidate = 300;

export default async function SightsByDivisionPage({ params }) {
  const { slug } = await params;
  const div = await fetchDivisionBySlugLoose(slug).catch(() => null);
  if (!div) notFound();
  const destinations = await fetchDestinationsByDivision(div.id).catch(() => []);
  const destIds = (destinations || []).map((d) => d.id).filter(Boolean);
  const pois = await fetchPOIsByDestinationIds(destIds).catch(() => []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-black/10 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            Sights in {div.name}
          </h1>
          <Link href="/sights" className="underline ml-4">
            Back
          </Link>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.isArray(pois) && pois.length > 0 ? (
          pois.map((p) => {
            const img = resolveImageUrl(p.image);
            const href = p.slug ? `/sights/poi/${encodeURIComponent(p.id)}` : `/sights/poi/${encodeURIComponent(p.id)}`;
            return (
              <Link
                key={p.id}
                href={href}
                className="block rounded-lg border overflow-hidden focus:outline-none focus:ring-2 focus:ring-black/40"
              >
                <div className="aspect-[4/3] relative bg-black/5">
                  {img ? (
                    <SafeImage
                      src={img}
                      alt={p.title}
                      fill
                      sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <div className="font-medium">{p.title}</div>
                  {p.summary ? (
                    <p className="text-sm text-black/70 mt-1 line-clamp-3">{p.summary}</p>
                  ) : null}
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full text-black/60">No sights found for this division.</div>
        )}
      </section>
    </main>
  );
}

