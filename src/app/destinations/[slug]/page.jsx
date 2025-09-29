import { notFound } from "next/navigation";
import EmblaCarousel from "@/components/EmblaCarousel";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import RichText from "@/components/RichText";
import { Card, CardContent } from "@/components/ui/card";
import {
  firstImageFromImages,
  imagesToGallery,
  resolveImageUrl,
} from "@/lib/imageUrl";
import GygWidget from "@/components/GygWidget";
import { getDestinationBySlug } from "@/lib/data/destinations";

export const revalidate = 900;
export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export default async function DestinationPage(props) {
  const { slug } = (await props?.params) || {};
  if (!slug) notFound();

  let dst = null;
  try {
    dst = await getDestinationBySlug(slug);
  } catch (e) {
    console.error("Destination fetch failed", { slug, error: e });
  }
  if (!dst) notFound();

  const hero = resolveImageUrl(firstImageFromImages(dst.images ?? []));
  const gallery = imagesToGallery(dst.images ?? []).slice(1);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            {dst.name}
          </h1>
          <Link href="/destinations" className="underline ml-4">
            Back
          </Link>
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <div className="order-1 md:order-2">
          {gallery.length > 0 ? (
            <EmblaCarousel
              images={gallery}
              options={{ loop: true, align: "start" }}
              className="rounded-xl overflow-hidden"
              slideClass="h-[48vh] min-h-[320px]"
            />
          ) : hero ? (
            <SafeImage
              src={hero}
              alt={dst.name}
              width={1200}
              height={800}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="w-full h-auto rounded-xl object-cover"
              priority={false}
            />
          ) : (
            <div className="flex items-center justify-center h-64 bg-muted rounded-xl">
              <span className="text-muted-foreground">No image available</span>
            </div>
          )}
        </div>

        {dst.credit ? (
          <p className="mt-2 text-xs text-muted-foreground text-right order-3 md:order-3">
            {dst.credit}
          </p>
        ) : null}

        <div className="order-2 md:order-1">
          {dst.body_richtext ? (
            <RichText value={dst.body_richtext} />
          ) : dst.summary ? (
            <RichText value={dst.summary} />
          ) : (
            <p className="text-muted-foreground">More details coming soon.</p>
          )}
        </div>
      </section>

      {dst.gyg_location_id ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-2">Popular tours</h2>
          <GygWidget locationId={dst.gyg_location_id} />
        </section>
      ) : null}

      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
        <Card>
          <CardContent className="p-3 space-y-1">
            <div>
              <span className="font-medium text-foreground">Slug:</span>{" "}
              {dst.slug}
            </div>
            <div>
              <span className="font-medium text-foreground">Status:</span>{" "}
              {dst.status ?? "—"}
            </div>
            {dst.published_at ? (
              <div>
                <span className="font-medium text-foreground">Published:</span>{" "}
                {new Date(dst.published_at).toLocaleDateString()}
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 space-y-1">
            <div>
              <span className="font-medium text-foreground">
                Prefecture ID:
              </span>{" "}
              {dst.prefecture_id ?? "—"}
            </div>
            <div>
              <span className="font-medium text-foreground">Division ID:</span>{" "}
              {dst.division_id ?? "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 space-y-1">
            <div>
              <span className="font-medium text-foreground">Latitude:</span>{" "}
              {dst.lat ?? "—"}
              <span className="mx-2">|</span>
              <span className="font-medium text-foreground">
                Longitude:
              </span>{" "}
              {dst.lng ?? "—"}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
