import Link from "next/link";
import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import {
  getRegionBySlug,
  getPrefectureBySlug,
  getDivisionBySlugLoose,
  getDestinationsByDivision,
} from "@/lib/data/geo";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";

export default async function DivisionPage(props) {
  const { params } = await props?.params;
  const { region, prefecture, division } = params || {};

  const reg = await getRegionBySlug(region).catch(() => null);
  if (!reg) notFound();
  const pref = await getPrefectureBySlug(prefecture, reg.id).catch(() => null);
  if (!pref) notFound();
  const div = await getDivisionBySlugLoose(division).catch(() => null);
  if (!div) notFound();

  const destinations = await getDestinationsByDivision(div.id).catch(() => []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-black/60 mb-4">
        <Link href="/regions" className="underline">
          Regions
        </Link>
        <span> / </span>
        <Link href={`/${reg.slug}/${pref.slug}`} className="underline">
          {reg.name}
        </Link>
        <span> / </span>
        <span className="text-black">
          {pref.name} — {div.name}
        </span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl md:text-4xl font-medium">{div.name}</h1>
        <Link href={`/sights/division/${div.slug}`} className="underline">
          Sights in {div.name}
        </Link>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {destinations.map((dst) => {
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
    </main>
  );
}

export const revalidate = 300;
export const runtime = "nodejs";
