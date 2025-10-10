import { notFound } from "next/navigation";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";
import { getRegionBySlugPublic } from "@/lib/data/public/geo";
import { listSightsByRegionSlug } from "@/lib/data/public/sights";

export const revalidate = 300;
export const runtime = "nodejs";

export default async function SightsByRegionPage(props) {
  const { slug } = (await props.params) || {};
  const region = await getRegionBySlugPublic(slug);
  if (!region) notFound();
  const pois = await listSightsByRegionSlug(slug);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            Sights in {region.name}
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
            const img = resolveImageUrl(firstImageFromImages(p?.images));
            const href = p.slug ? `/sights/${encodeURIComponent(p.slug)}` : null;
            const Tag = href ? Link : "div";
            const linkProps = href ? { href } : {};
            return (
              <Card
                asChild
                className="overflow-hidden transition-shadow hover:shadow-md"
              >
                <Tag
                  key={p.id}
                  {...linkProps}
                  className="block focus:outline-none focus:ring-2 focus:ring-ring"
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
                  <CardContent className="p-4">
                    <div className="font-medium">{p.title || p.name}</div>
                    {p.summary ? (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                        {p.summary}
                      </p>
                    ) : null}
                  </CardContent>
                </Tag>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-muted-foreground">
            No sights found for this region.
          </div>
        )}
      </section>
    </main>
  );
}
