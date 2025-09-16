// moved from [poi]/page.jsx
import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";
import RichTextReadOnly from "@/components/RichTextReadOnly";
import GygWidget from "@/components/GygWidget";
import { getSightBySlugs, getSightOpeningHours, getSightOpeningExceptions } from "@/lib/data/sights";
import { fmtTime, fmtJPY } from "@/lib/format";

export const revalidate = 300;
export const runtime = 'nodejs';


const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function SightDetailBySlugPage({ params }) {
  const { slug, sight } = await params;
  const result = await getSightBySlugs(slug, sight).catch(() => null);
  if (!result?.sight || !result?.destination) notFound();
  const { sight: p, destination: dest } = result;
  let rules = [];
  let exceptions = [];
  const [r, e] = await Promise.all([
    getSightOpeningHours(p.id).catch(() => []),
    getSightOpeningExceptions(p.id).catch(() => []),
  ]);
  rules = r || [];
  exceptions = e || [];

  let imgPath = null;
  if (p.images) {
    if (Array.isArray(p.images) && p.images.length > 0) {
      const first = p.images[0];
      imgPath = (first && (first.url || first.src)) || (typeof first === 'string' ? first : null);
    } else if (typeof p.images === 'string') {
      imgPath = p.images;
    }
  }
  const img = resolveImageUrl(imgPath);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">{p.name}</h1>
          <Link href={`/sights/${dest.slug}`} className="underline ml-4">Back</Link>
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <div className="md:col-span-2">
          {img ? (
            <SafeImage
              src={img}
              alt={p.name}
              width={1200}
              height={800}
              className="w-full h-auto rounded-xl object-cover"
            />
          ) : null}
        </div>

        <div className="md:col-span-2">
          <Card className="mb-4">
            <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm text-muted-foreground flex flex-wrap gap-3">
                {dest ? (
                  <span>
                    <span className="font-medium text-foreground">Destination:</span>{" "}
                    <Link href={`/destinations/${dest.slug}`} className="underline">{dest.name}</Link>
                  </span>
                ) : null}
                {fmtJPY(p.price_amount) ? (
                  <span><span className="font-medium text-foreground">Price:</span> {fmtJPY(p.price_amount)}</span>
                ) : null}
                {p.duration_minutes ? (
                  <span><span className="font-medium text-foreground">Duration:</span> {p.duration_minutes} min</span>
                ) : null}
                {p.provider ? (
                  <span><span className="font-medium text-foreground">Provider:</span> {p.provider}</span>
                ) : null}
              </div>
              {p.deeplink ? (
                <a
                  href={p.deeplink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 hover:opacity-90"
                >
                  {p.provider && String(p.provider).toLowerCase() === 'gyg' ? 'Book on GetYourGuide' : 'Book Now'}
                </a>
              ) : null}
            </div>
            </CardContent>
          </Card>

          {p.summary ? <p className="text-lg leading-relaxed mb-3">{p.summary}</p> : null}
          {Array.isArray(p.tags) && p.tags.length > 0 ? (
            <div className="mb-3 flex flex-wrap gap-2">
              {p.tags.map((t, i) => (
                <span key={i} className="inline-block rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-xs">{t}</span>
              ))}
            </div>
          ) : null}
          {p.body_richtext ? <RichTextReadOnly value={p.body_richtext} /> : null}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Opening Hours</h2>
          {Array.isArray(rules) && rules.length > 0 ? (
            <ul className="divide-y rounded-[var(--radius)] border bg-card text-card-foreground">
              {rules.map((r, i) => {
                const closed = !!r.is_closed;
                return (
                  <li key={i} className="flex items-center justify-between px-3 py-2">
                    <span className="font-medium">{DAY_LABELS[r.weekday ?? 0] || "Day"}</span>
                    <span className="text-muted-foreground">{closed ? "Closed" : `${fmtTime(r.open_time) || "—"} – ${fmtTime(r.close_time) || "—"}`}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground">See provider for details.</p>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Exceptions</h2>
          {Array.isArray(exceptions) && exceptions.length > 0 ? (
            <ul className="divide-y rounded-[var(--radius)] border bg-card text-card-foreground">
              {exceptions.map((e, i) => {
                const closed = !!e.is_closed;
                return (
                  <li key={i} className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{e.date}</span>
                      <span className="text-muted-foreground">{closed ? "Closed" : `${fmtTime(e.open_time) || "—"} – ${fmtTime(e.close_time) || "—"}`}</span>
                    </div>
                    {e.note ? <div className="text-xs text-black/60 mt-1">{e.note}</div> : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground">No exceptions listed.</p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Popular tours</h2>
        <GygWidget tourId={p.gyg_id} />
      </section>
    </main>
  );
}
