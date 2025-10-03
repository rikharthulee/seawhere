import { notFound } from "next/navigation";
import { getDestinationBySlugLoose } from "@/lib/data/destinations";
import { getToursForDestination } from "@/lib/data/tours";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";

export const revalidate = 300;
export const runtime = "nodejs";

export default async function ToursByDestinationPage(props) {
  const params = (await props.params) || {};
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const { slug } = params || {};
  const divisionSlug =
    searchParams && typeof searchParams === "object"
      ? searchParams.division || null
      : null;
  let dst = await getDestinationBySlugLoose(slug).catch(() => null);
  if (!dst) notFound();
  const tours = await getToursForDestination(dst.id, divisionSlug).catch(
    () => []
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            Tours in {dst.name}
          </h1>
          <Link href="/tours" className="underline ml-4">
            Back
          </Link>
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.isArray(tours) && tours.length > 0 ? (
          tours.map((p) => {
            let imgPath = p.image || null;
            if (!imgPath && p.images) {
              if (Array.isArray(p.images) && p.images.length > 0) {
                const first = p.images[0];
                imgPath =
                  (first && (first.url || first.src)) ||
                  (typeof first === "string" ? first : null);
              } else if (typeof p.images === "string") {
                imgPath = p.images;
              }
            }
            const img = resolveImageUrl(imgPath);
            const canLink = !!p.slug;
            const CardTag = canLink ? Link : "div";
            const cardProps = canLink
              ? {
                  href: `/tours/${encodeURIComponent(
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
            No tours yet for this destination.
          </div>
        )}
      </section>
    </main>
  );
}
