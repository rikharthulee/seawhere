import { notFound } from "next/navigation";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { resolveImageUrl } from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";
import { getPrefectureBySlugPublic } from "@/lib/data/public/geo";
import { listToursByPrefectureSlug } from "@/lib/data/public/tours";

export const revalidate = 300;
export const runtime = "nodejs";

export default async function ToursByPrefecturePage(props) {
  const { slug } = (await props.params) || {};
  const pref = await getPrefectureBySlugPublic(slug);
  if (!pref?.id) notFound();

  const items = await listToursByPrefectureSlug(slug);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            Tours in {pref.name}
          </h1>
          <Link href="/tours" className="underline ml-4">
            Back
          </Link>
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.isArray(items) && items.length > 0 ? (
          items.map((p) => {
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
            const href = p.slug ? `/tours/${encodeURIComponent(p.slug)}` : null;
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
          <div className="col-span-full text-black/60">
            No tours found for this prefecture.
          </div>
        )}
      </section>
    </main>
  );
}
