import { notFound } from "next/navigation";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { resolveImageUrl } from "@/lib/imageUrl";
import { getDivisionBySlugLoose, getDestinationsByDivision } from "@/lib/data/geo";
import { getSightsByDestinationIds } from "@/lib/data/sights";

export const revalidate = 300;
export const runtime = 'nodejs';

export default async function SightsByDivisionPage({ params }) {
  const { slug } = await params;
  const div = await getDivisionBySlugLoose(slug).catch(() => null);
  if (!div) notFound();
  const destinations = await getDestinationsByDivision(div.id).catch(() => []);
  const destIds = (destinations || []).map((d) => d.id).filter(Boolean);
  const pois = await getSightsByDestinationIds(destIds).catch(() => []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            Sights in {div.name}
          </h1>
          <Link href="/sights" className="underline ml-4">
            Back
          </Link>
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.isArray(pois) && pois.length > 0 ? (
          pois.map((p) => {
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
            const destSlug = p?.destinations?.slug || null;
            const canLink = !!(destSlug && p.slug);
            const Tag = canLink ? Link : 'div';
            const linkProps = canLink ? { href: `/sights/${encodeURIComponent(destSlug)}/${encodeURIComponent(p.slug)}` } : {};
            return (
              <Tag
                key={p.id}
                {...linkProps}
                className="block rounded-[var(--radius)] border bg-card text-card-foreground overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <div className="aspect-[4/3] relative bg-muted">
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
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{p.summary}</p>
                  ) : null}
                </div>
              </Tag>
            );
          })
        ) : (
          <div className="col-span-full text-muted-foreground">No sights found for this division.</div>
        )}
      </section>
    </main>
  );
}
