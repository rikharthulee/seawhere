import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/imageUrl";
import RichTextReadOnly from "@/components/RichTextReadOnly";
import GygWidget from "@/components/GygWidget";
import { fetchPOIByDestinationAndSlug, fetchPOIOpeningRules, fetchPOIOpeningExceptions } from "@/lib/supabaseRest";

export const revalidate = 300;

function fmtTime(t) {
  if (!t) return null;
  const s = String(t);
  const m = s.match(/^([0-9]{1,2}:[0-9]{2})(?::[0-9]{2})?$/);
  return m ? m[1] : s;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function POIDetailBySlugPage({ params }) {
  const { slug, poi } = await params;
  const result = await fetchPOIByDestinationAndSlug(slug, poi).catch(() => null);
  if (!result?.poi || !result?.destination) notFound();
  const { poi: p, destination: dest } = result;
  const [rules, exceptions] = await Promise.all([
    fetchPOIOpeningRules(p.id).catch(() => []),
    fetchPOIOpeningExceptions(p.id).catch(() => []),
  ]);

  const img = resolveImageUrl(p.image);
  const price = p.price || null;
  function fmtPrice(val) {
    if (!val) return null;
    const parts = [];
    if (typeof val.gbp === "number") parts.push(`£${val.gbp.toFixed(2)}`);
    if (typeof val.usd === "number") parts.push(`$${val.usd.toFixed(2)}`);
    if (typeof val.jpy === "number") parts.push(`¥${Math.round(val.jpy).toLocaleString("en-US")}`);
    return parts.join(" / ");
  }
  function fmtDuration(mins) {
    if (mins == null) return null;
    const m = Number(mins);
    if (!Number.isFinite(m) || m <= 0) return null;
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (h && r) return `${h}h ${r}m`;
    if (h) return `${h}h`;
    return `${r}m`;
  }
  function providerLabel(code) {
    if (!code) return null;
    const c = String(code).toLowerCase();
    if (c === "gyg") return "GetYourGuide";
    if (c === "dekitabi") return "Dekitabi";
    if (c === "internal") return null;
    return c.charAt(0).toUpperCase() + c.slice(1);
  }

  function inferProvider(p) {
    if (!p) return null;
    const url = String(p.deeplink || "").toLowerCase();
    if (p.gyg_tour_id || url.includes("getyourguide")) return "GetYourGuide";
    if (url.includes("dekitabi")) return "Dekitabi";
    if (url.includes("viator")) return "Viator";
    if (url.includes("tripadvisor")) return "Tripadvisor";
    return null;
  }

  // Opening rules/exceptions are shown on the ID route today; keep the same
  // minimal layout here for parity without additional round-trips.
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-black/10 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">{p.title}</h1>
          <Link href={`/sights/${dest.slug}`} className="underline ml-4">Back</Link>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <div className="md:col-span-2">
          {img ? (
            <SafeImage
              src={img}
              alt={p.title}
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
                {fmtDuration(p.duration_minutes) ? (
                  <span><span className="font-medium text-black">Duration:</span> {fmtDuration(p.duration_minutes)}</span>
                ) : null}
                {fmtPrice(price) ? (
                  <span><span className="font-medium text-black">Price:</span> {fmtPrice(price)}</span>
                ) : null}
                {dest ? (
                  <span>
                    <span className="font-medium text-black">Destination:</span>{" "}
                    <Link href={`/destinations/${dest.slug}`} className="underline">{dest.name}</Link>
                  </span>
                ) : null}
              </div>
              {p.deeplink ? (
                <a
                  href={p.deeplink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
                >
                  {(() => {
                    const brand = providerLabel(p.provider) || inferProvider(p);
                    return `Book Now${brand ? ` on ${brand}` : ""}`;
                  })()}
                </a>
              ) : null}
            </div>
          </div>

          {p.summary ? <p className="text-lg leading-relaxed mb-3">{p.summary}</p> : null}
          {p.details ? <RichTextReadOnly value={p.details} /> : null}

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-2">Popular tours</h2>
            <GygWidget tourId={p.gyg_tour_id} />
          </div>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Opening Hours</h2>
          {Array.isArray(rules) && rules.length > 0 ? (
            <ul className="divide-y rounded border">
              {rules.map((r, i) => (
                <li key={i} className="flex items-center justify-between px-3 py-2">
                  <span className="font-medium">{DAY_LABELS[r.day_of_week ?? 0] || "Day"}</span>
                  <span className="text-black/70">{fmtTime(r.open_time) || "—"} – {fmtTime(r.close_time) || "—"}</span>
                </li>
              ))}
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
                const same = e.start_date === e.end_date;
                const date = same ? e.start_date : `${e.start_date} – ${e.end_date}`;
                const closed = !!e.closed;
                return (
                  <li key={i} className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{date}</span>
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
    </main>
  );
}
