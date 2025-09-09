import { notFound } from "next/navigation";
import { fetchDestinationBySlug, fetchPOIsByDestination } from "@/lib/supabaseRest";
import Image from "next/image";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/imageUrl";

export const revalidate = 300;

export default async function SightsByDestinationPage({ params }) {
  const { slug } = await params;
  const dst = await fetchDestinationBySlug(slug).catch(() => null);
  if (!dst) notFound();
  const pois = await fetchPOIsByDestination(dst.id).catch(() => []);

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
        {Array.isArray(pois) && pois.length > 0 ? (
          pois.map((p) => {
            const img = resolveImageUrl(p.image);
            return (
              <article key={p.id} className="rounded-lg border overflow-hidden">
                <div className="aspect-[4/3] relative bg-black/5">
                  {img ? (
                    <Image
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
              </article>
            );
          })
        ) : (
          <div className="col-span-full text-black/60">No sights yet for this destination.</div>
        )}
      </section>
    </main>
  );
}

