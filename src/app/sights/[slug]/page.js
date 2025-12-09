import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";
import GygWidget from "@/components/GygWidget";
import { listSightsByDestinationSlug } from "@/lib/data/public/sights";

export const revalidate = 300;
export const runtime = "nodejs";

export default async function SightsByDestinationPage(props) {
  const { slug } = (await props.params) || {};
  const { destination: dst, sights } = await listSightsByDestinationSlug(slug);
  if (!dst) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            Sights in {dst.name}
          </h1>
          <Link href="/sights" className="underline ml-4">
            Back
          </Link>
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.isArray(sights) && sights.length > 0 ? (
          sights.map((p) => {
            const img = resolveImageUrl(firstImageFromImages(p?.images));
            const canLink = !!p.slug;
            const CardTag = canLink ? Link : "div";
            const cardProps = canLink
              ? {
                  href: `/sights/${encodeURIComponent(
                    dst.slug
                  )}/${encodeURIComponent(p.slug)}`,
                }
              : {};
            return (
              <Card
                key={p.id}
                asChild
                className="overflow-hidden transition-shadow hover:shadow-md"
              >
                <CardTag
                  {...cardProps}
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
                </CardTag>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-muted-foreground">
            No sights yet for this destination.
          </div>
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
