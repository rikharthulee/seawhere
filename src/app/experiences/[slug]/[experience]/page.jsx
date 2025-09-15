import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/imageUrl";
import RichTextReadOnly from "@/components/RichTextReadOnly";
import { getExperienceBySlugs, getExperienceAvailabilityRules, getExperienceExceptions } from "@/lib/data/experiences";

export const revalidate = 300;
export const runtime = 'nodejs';

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function fmtDays(days) {
  if (!Array.isArray(days) || days.length === 0) return "";
  return days
    .map((d) => DAY_LABELS[d] || "")
    .filter(Boolean)
    .join(", ");
}

export default async function ExperienceDetailBySlugPage({ params }) {
  const { slug, experience } = await params;
  const result = await getExperienceBySlugs(slug, experience).catch(() => null);
  if (!result?.experience || !result?.destination) notFound();
  const { experience: p, destination: dest } = result;
  let rules = [];
  let exceptions = [];
  const [r, e] = await Promise.all([
    getExperienceAvailabilityRules(p.id).catch(() => []),
    getExperienceExceptions(p.id).catch(() => []),
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
          <Link href={`/experiences/${dest.slug}`} className="underline ml-4">Back</Link>
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
              </div>
            </div>
          </div>

          {p.summary ? <p className="text-lg leading-relaxed mb-3">{p.summary}</p> : null}
          {p.body_richtext ? <RichTextReadOnly value={p.body_richtext} /> : null}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Availability</h2>
          {Array.isArray(rules) && rules.length > 0 ? (
            <ul className="divide-y rounded border">
              {rules.map((r, i) => {
                return (
                  <li key={i} className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{fmtDays(r.days_of_week)}</span>
                      <span className="text-black/70">{Array.isArray(r.start_times) ? r.start_times.join(', ') : ''}</span>
                    </div>
                    {(r.valid_from || r.valid_to) ? (
                      <div className="text-xs text-black/60 mt-1">
                        {r.valid_from ? `From ${r.valid_from}` : ''}
                        {r.valid_from && r.valid_to ? ' • ' : ''}
                        {r.valid_to ? `Until ${r.valid_to}` : ''}
                      </div>
                    ) : null}
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
              {exceptions.map((e, i) => (
                <li key={i} className="px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{e.date}</span>
                    <span className="text-black/70">{e.action}{e.start_time ? ` @ ${e.start_time}` : ''}</span>
                  </div>
                  {e.note ? <div className="text-xs text-black/60 mt-1">{e.note}</div> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-black/60">No exceptions listed.</p>
          )}
        </div>
      </section>
    </main>
  );
}

