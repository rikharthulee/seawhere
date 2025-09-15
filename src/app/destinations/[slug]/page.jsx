// app/destinations/[slug]/page.jsx
import { notFound } from "next/navigation";
import { getDestinationBySlug } from "@/lib/data/destinations";
import SafeImage from "@/components/SafeImage";
import EmblaCarousel from "@/components/EmblaCarousel";
import Link from "next/link";
import RichTextReadOnly from "@/components/RichTextReadOnly";
import GygWidget from "@/components/GygWidget";
import { resolveImageUrl } from "@/lib/imageUrl";

export const revalidate = 300;
export const runtime = 'nodejs';

export default async function DestinationPage({ params }) {
  const { slug } = await params;
  const dst = await getDestinationBySlug(slug).catch(() => null);
  if (!dst) notFound();

  const hero = resolveImageUrl(dst.hero_image || dst.thumbnail_image);
  const gallery = Array.isArray(dst.images) ? dst.images.map((k) => resolveImageUrl(k)).filter(Boolean) : [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">{dst.name}</h1>
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
          ) : null}
        </div>

        {/* Credit under image */}
        {dst.credit ? (
          <p className="mt-2 text-xs text-muted-foreground text-right order-3 md:order-3">
            {dst.credit}
          </p>
        ) : null}

        {/* Body rich text (do not show summary) */}
        <div className="order-2 md:order-1">
          {dst.body_richtext ? (
            <RichTextReadOnly value={dst.body_richtext} />
          ) : (
            <p className="text-muted-foreground">More details coming soon.</p>
          )}
        </div>
      </section>

      {/* Tours widget (GetYourGuide) */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-2">Popular tours</h2>
        <GygWidget locationId={dst.gyg_location_id} />
      </section>

      {/* Meta details */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
        <div className="rounded-[var(--radius)] border bg-card text-card-foreground p-3">
          <div><span className="font-medium text-foreground">Slug:</span> {dst.slug}</div>
          <div><span className="font-medium text-foreground">Status:</span> {dst.status}</div>
        </div>
        <div className="rounded-[var(--radius)] border bg-card text-card-foreground p-3">
          <div><span className="font-medium text-foreground">Prefecture ID:</span> {dst.prefecture_id || "—"}</div>
          <div><span className="font-medium text-foreground">Division ID:</span> {dst.division_id || "—"}</div>
        </div>
        <div className="rounded-[var(--radius)] border bg-card text-card-foreground p-3">
          <div><span className="font-medium text-foreground">Lat/Lng:</span> {dst.lat ?? "—"}, {dst.lng ?? "—"}</div>
          <div><span className="font-medium text-foreground">Published:</span> {dst.published_at ? new Date(dst.published_at).toLocaleDateString() : "—"}</div>
        </div>
      </section>
    </main>
  );
}
