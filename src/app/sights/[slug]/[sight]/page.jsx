// moved from [poi]/page.jsx
import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/imageUrl";
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
      <div className="border-t-2 border-black/10 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">{p.name}</h1>
          <Link href={`/sights/${dest.slug}`} className="underline ml-4">Back</Link>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
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
          <div className="rounded-lg border p-3 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm text-black/70 space-x-3">
                {dest ? (
                  <span>
                    <span className="font-medium text-black">Destination:</span>{" "}
                    <Link href={`/destinations/${dest.slug}`} className="underline">{dest.name}</Link>
                  </span>
                ) : null}
                {fmtJPY(p.price_amount) ? (
                  <span><span className="font-medium text-black">Price:</span> {fmtJPY(p.price_amount)}</span>
                ) : null}
              </div>
              {p.deeplink ? (
                <a
                  href={p.deeplink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
                >
                  {p.provider && String(p.provider).toLowerCase() === 'gyg' ? 'Book on GetYourGuide' : 'Book Now'}
                </a>
              ) : null}
            </div>
          </div>

          {p.summary ? <p className="text-lg leading-relaxed mb-3">{p.summary}</p> : null}
          {p.body_richtext ? <RichTextReadOnly value={p.body_richtext} /> : null}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Opening Hours</h2>
          {Array.isArray(rules) && rules.length > 0 ? (
            <ul className="divide-y rounded border">
              {rules.map((r, i) => {
                const closed = !!r.is_closed;
                return (
                  <li key={i} className="flex items-center justify-between px-3 py-2">
                    <span className="font-medium">{DAY_LABELS[r.weekday ?? 0] || "Day"}</span>
                    <span className="text-black/70">{closed ? "Closed" : `${fmtTime(r.open_time) || "—"} – ${fmtTime(r.close_time) || "—"}`}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-black/60">See provider for details.</p>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Exceptions</h2>
          {Array.isArray(exceptions) && exceptions.length > 0 ? (
            <ul className="divide-y rounded border">
              {exceptions.map((e, i) => {
                const closed = !!e.is_closed;
                return (
                  <li key={i} className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{e.date}</span>
                      <span className="text-black/70">{closed ? "Closed" : `${fmtTime(e.open_time) || "—"} – ${fmtTime(e.close_time) || "—"}`}</span>
                    </div>
                    {e.note ? <div className="text-xs text-black/60 mt-1">{e.note}</div> : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-black/60">No exceptions listed.</p>
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
