import { notFound } from "next/navigation";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";
import RichTextReadOnly from "@/components/RichTextReadOnly";
import RichText from "@/components/RichText";
import { getTourBySlugPublic } from "@/lib/data/public/tours";
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

export default async function TourBySlugPage(props) {
  const { slug } = (await props.params) || {};
  const { debug } = (await props.searchParams) || {};
  const result = await getTourBySlugPublic(slug);
  if (!result?.tour && !debug) notFound();

  const tour = result?.tour || null;
  const destination = result?.destination || null;

  let imgPath = null;
  if (tour?.images) {
    if (Array.isArray(tour.images) && tour.images.length > 0) {
      const first = tour.images[0];
      imgPath =
        (first && (first.url || first.src)) ||
        (typeof first === "string" ? first : null);
    } else if (typeof tour.images === "string") {
      imgPath = tour.images;
    }
  }
  const img = resolveImageUrl(imgPath);

  const availabilityRules = [];
  const availabilityExceptions = [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      {!tour && debug ? (
        <pre className="rounded-md border bg-muted p-3 text-xs overflow-x-auto">
          {JSON.stringify({ slug, result }, null, 2)}
        </pre>
      ) : null}

      <div className="border-t-2 border-border pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
            {tour?.name || "Tour"}
          </h1>
          {destination?.slug ? (
            <Link
              href={`/tours/destination/${destination.slug}`}
              className="underline ml-4"
            >
              Back
            </Link>
          ) : (
            <Link href="/tours" className="underline ml-4">
              Back
            </Link>
          )}
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>

      {tour ? (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          <div className="md:col-span-2">
            {img ? (
              <SafeImage
                src={img}
                alt={tour.name}
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
                    {fmtJPY(tour.price_amount) ? (
                      <span>
                        <span className="font-medium text-foreground">
                          Price:
                        </span>{" "}
                        {fmtJPY(tour.price_amount)}
                      </span>
                    ) : null}
                    {tour.duration_minutes ? (
                      <span>
                        <span className="font-medium text-foreground">
                          Duration:
                        </span>{" "}
                        {tour.duration_minutes} min
                      </span>
                    ) : null}
                    {tour.provider ? (
                      <span>
                        <span className="font-medium text-foreground">
                          Provider:
                        </span>{" "}
                        {tour.provider}
                      </span>
                    ) : null}
                  </div>
                  {tour.deeplink ? (
                    <a
                      href={tour.deeplink}
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

            {tour.summary ? (
              <p className="text-lg leading-relaxed mb-3">{tour.summary}</p>
            ) : null}
            {tour.description ? (
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <RichText value={tour.description} />
              </div>
            ) : null}
            {Array.isArray(tour.tags) && tour.tags.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {tour.tags.map((t, i) => (
                  <span
                    key={i}
                    className="inline-block rounded-full bg-black/10 px-2 py-0.5 text-xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
            {tour.body_richtext ? (
              <RichTextReadOnly value={tour.body_richtext} />
            ) : null}
          </div>
        </section>
      ) : null}

      {tour ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Book this tour</h2>
          <GygWidget tourId={tour.gyg_id} />
        </section>
      ) : null}

      {tour ? (
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
