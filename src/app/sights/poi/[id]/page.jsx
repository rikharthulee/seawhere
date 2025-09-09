import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/imageUrl";
import RichText from "@/components/RichText";
import { fetchPOIById, fetchPOIOpeningRules, fetchPOIOpeningExceptions, fetchDestinationById } from "@/lib/supabaseRest";

export const revalidate = 300;

function fmtTime(t) {
  if (!t) return null;
  // Expect HH:MM or HH:MM:SS, trim seconds
  const s = String(t);
  const m = s.match(/^([0-9]{1,2}:[0-9]{2})(?::[0-9]{2})?$/);
  return m ? m[1] : s;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function POIDetailPage({ params }) {
  const { id } = await params;
  const poi = await fetchPOIById(id).catch(() => null);
  if (!poi) notFound();
  const [rules, exceptions, dest] = await Promise.all([
    fetchPOIOpeningRules(poi.id).catch(() => []),
    fetchPOIOpeningExceptions(poi.id).catch(() => []),
    fetchDestinationById(poi.destination_id).catch(() => null),
  ]);

  const img = resolveImageUrl(poi.image);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-black/10 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">{poi.title}</h1>
          <Link href="/sights" className="underline ml-4">Back</Link>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <div className="order-1 md:order-2">
          {img ? (
            <Image
              src={img}
              alt={poi.title}
              width={1200}
              height={800}
              className="w-full h-auto rounded-xl object-cover"
            />
          ) : null}
        </div>

        <div className="order-2 md:order-1">
          {poi.summary ? <p className="text-lg leading-relaxed mb-3">{poi.summary}</p> : null}
          {poi.details ? <RichText value={poi.details} /> : null}
          <div className="mt-4 space-y-1 text-sm text-black/70">
            {dest ? (
              <div>
                <span className="font-medium text-black">Destination:</span>{" "}
                <Link href={`/destinations/${dest.slug}`} className="underline">{dest.name}</Link>
              </div>
            ) : null}
            {poi.provider ? <div><span className="font-medium text-black">Provider:</span> {poi.provider}</div> : null}
            {poi.deeplink ? (
              <div>
                <a href={poi.deeplink} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                  Book / Learn more
                </a>
              </div>
            ) : null}
            {(poi.lat ?? poi.lng) ? (
              <div><span className="font-medium text-black">Location:</span> {poi.lat ?? "—"}, {poi.lng ?? "—"}</div>
            ) : null}
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
