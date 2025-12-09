import Link from "next/link";
import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import { Card, CardContent } from "@/components/ui/card";
import { listDestinationsByCountrySlug } from "@/lib/data/public/geo";
import { firstImageFromImages, resolveImageUrl } from "@/lib/imageUrl";

export const revalidate = 300;
export const runtime = "nodejs";

export default async function CountryPage(props) {
  const { slug } = (await props.params) || {};
  const { country, destinations } = await listDestinationsByCountrySlug(slug);
  if (!country) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-3xl md:text-4xl font-medium">{country.name}</h1>
        <Link href="/countries" className="underline text-sm">
          All countries
        </Link>
      </div>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {destinations.map((dst) => {
          const img = resolveImageUrl(firstImageFromImages(dst.images));
          return (
            <Card
              key={dst.id}
              asChild
              className="overflow-hidden transition-shadow hover:shadow-md"
            >
              <Link href={`/destination/${dst.slug}`} className="block focus:outline-none focus:ring-2 focus:ring-ring">
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
