import Link from "next/link";
import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import {
  getRegionBySlugPublic,
  getPrefectureBySlugPublic,
  listDivisionsByPrefectureId,
  listDestinationsByPrefectureId,
} from "@/lib/data/public/geo";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";

export default async function PrefecturePage(props) {
  const { region, prefecture } = (await props.params) || {};

  const reg = await getRegionBySlugPublic(region);
  if (!reg) notFound();
  const pref = await getPrefectureBySlugPublic(prefecture);
  if (!pref) notFound();

  const divisions = await listDivisionsByPrefectureId(pref.id);
  const allPrefDests = await listDestinationsByPrefectureId(pref.id);
  const unassignedDests = Array.isArray(allPrefDests)
    ? allPrefDests.filter((d) => !d.division_id)
    : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-muted-foreground mb-4">
        <Link href="/regions" className="underline">
          Regions
        </Link>
        <span> / </span>
        <span>{reg.name}</span>
        <span> / </span>
        <span className="text-foreground">{pref.name}</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl md:text-4xl font-medium">{pref.name}</h1>
        <Link href={`/sights/prefecture/${pref.slug}`} className="underline">
          Sights in {pref.name}
        </Link>
      </div>

      {divisions.length > 0 ? (
        <>
          <section className="space-y-6">
            {divisions.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{d.name}</h2>
                    <Link
                      href={`/${reg.slug}/${pref.slug}/${d.slug}`}
                      className="underline"
                    >
                      View all
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
          {unassignedDests.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-xl font-semibold mb-3">
                Other destinations in {pref.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {unassignedDests.map((dst) => {
                  const img = resolveImageUrl(firstImageFromImages(dst.images));
                  return (
                    <Card
                      key={dst.id}
                      asChild
                      className="overflow-hidden transition-shadow hover:shadow-md"
                    >
                      <Link
                        href={`/destinations/${dst.slug}`}
                        className="block focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <div className="aspect-[4/3] relative bg-black/5">
                          {img ? (
                            <SafeImage
                              src={img}
                              alt={dst.name}
                              fill
                              className="object-cover"
                              sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                            />
                          ) : null}
                        </div>
                        <CardContent className="p-4">
                          <div className="font-medium">{dst.name}</div>
                        </CardContent>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {unassignedDests.map((dst) => {
            const img = resolveImageUrl(firstImageFromImages(dst.images));
            return (
              <Card
                key={dst.id}
                asChild
                className="overflow-hidden transition-shadow hover:shadow-md"
              >
                <Link
                  href={`/destinations/${dst.slug}`}
                  className="block focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <div className="aspect-[4/3] relative bg-black/5">
                    {img ? (
                      <SafeImage
                        src={img}
                        alt={dst.name}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                    ) : null}
                  </div>
                  <CardContent className="p-4">
                    <div className="font-medium">{dst.name}</div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </section>
      )}
    </main>
  );
}

export const revalidate = 300;
export const runtime = "nodejs";
