import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";
import RichTextReadOnly from "@/components/RichTextReadOnly";
import { getExperienceBySlugPublic } from "@/lib/data/public/experiences";
import { fmtJPY } from "@/lib/format";
import GygWidget from "@/components/GygWidget";

export const revalidate = 300;
export const runtime = "nodejs";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function fmtDays(days) {
  if (!Array.isArray(days) || days.length === 0) return "";
  return days
    .map((d) => DAY_LABELS[d] || "")
    .filter(Boolean)
    .join(", ");
}

export default async function ExperienceBySlugPage(props) {
  const { slug } = (await props.params) || {};
  const { debug } = (await props.searchParams) || {};
  const result = await getExperienceBySlugPublic(slug);
  if (!result?.experience && !debug) notFound();

  const experience = result?.experience || null;
  const destination = result?.destination || null;

  let imgPath = null;
  if (experience?.images) {
    if (Array.isArray(experience.images) && experience.images.length > 0) {
      const first = experience.images[0];
      imgPath =
        (first && (first.url || first.src)) ||
        (typeof first === "string" ? first : null);
    } else if (typeof experience.images === "string") {
      imgPath = experience.images;
    }
  }
  const img = resolveImageUrl(imgPath);

  const availabilityRules = [];
  const availabilityExceptions = [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      {!experience && debug ? (
        <pre className="rounded-md border bg-muted p-3 text-xs overflow-x-auto">
          {JSON.stringify({ slug, result }, null, 2)}
        </pre>
      ) : null}

      <div className="flex items-center justify-between pt-2">
        <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
          {experience?.name || "Experience"}
        </h1>
        {destination?.slug ? (
          <Link
            href={`/experiences/destination/${destination.slug}`}
            className="underline ml-4"
          >
            Back
          </Link>
        ) : (
          <Link href="/experiences" className="underline ml-4">
            Back
          </Link>
        )}
      </div>

      {experience ? (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          <div className="md:col-span-2">
            {img ? (
              <SafeImage
                src={img}
                alt={experience.name}
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
                    {destination ? (
                      <span>
                        <span className="font-medium text-foreground">
                          Destination:
                        </span>{" "}
                        <Link
                          href={`/destination/${destination.slug}`}
                          className="underline"
                        >
                          {destination.name}
                        </Link>
                      </span>
                    ) : null}
                    {fmtJPY(experience.price_amount) ? (
                      <span>
                        <span className="font-medium text-foreground">
                          Price:
                        </span>{" "}
                        {fmtJPY(experience.price_amount)}
                      </span>
                    ) : null}
                    {experience.duration_minutes ? (
                      <span>
                        <span className="font-medium text-foreground">
                          Duration:
                        </span>{" "}
                        {experience.duration_minutes} min
                      </span>
                    ) : null}
                    {experience.provider ? (
                      <span>
                        <span className="font-medium text-foreground">
                          Provider:
                        </span>{" "}
                        {experience.provider}
                      </span>
                    ) : null}
                  </div>
                  {experience.deeplink ? (
                    <a
                      href={experience.deeplink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 hover:opacity-90"
                    >
                      Book Now
                    </a>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {experience.summary ? (
              <p className="text-lg leading-relaxed mb-3">
                {experience.summary}
              </p>
            ) : null}
            {experience.body_richtext ? (
              <RichTextReadOnly value={experience.body_richtext} />
            ) : null}
            {Array.isArray(experience.tags) && experience.tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {experience.tags.map((t, i) => (
                  <span
                    key={i}
                    className="inline-block rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {experience ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Book this experience</h2>
          <GygWidget tourId={experience.gyg_id} />
        </section>
      ) : null}

      {experience ? (
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Availability</h2>
            {Array.isArray(availabilityRules) && availabilityRules.length > 0 ? (
              <ul className="divide-y rounded-[var(--radius)] border bg-card text-card-foreground">
                {availabilityRules.map((r, i) => (
                  <li key={i} className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{fmtDays(r.days_of_week)}</span>
                      <span className="text-muted-foreground">
                        {Array.isArray(r.start_times) ? r.start_times.join(", ") : ""}
                      </span>
                    </div>
                    {r.valid_from || r.valid_to ? (
                      <div className="text-xs text-muted-foreground mt-1">
                        {r.valid_from ? `From ${r.valid_from}` : ""}
                        {r.valid_from && r.valid_to ? " • " : ""}
                        {r.valid_to ? `Until ${r.valid_to}` : ""}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">See provider for details.</p>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Exceptions</h2>
            {Array.isArray(availabilityExceptions) && availabilityExceptions.length > 0 ? (
              <ul className="divide-y rounded-[var(--radius)] border bg-card text-card-foreground">
                {availabilityExceptions.map((e, i) => (
                  <li key={i} className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{e.date}</span>
                      <span className="text-muted-foreground">
                        {e.action}
                        {e.start_time ? ` @ ${e.start_time}` : ""}
                      </span>
                    </div>
                    {e.note ? (
                      <div className="text-xs text-muted-foreground mt-1">
                        {e.note}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No exceptions listed.</p>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
