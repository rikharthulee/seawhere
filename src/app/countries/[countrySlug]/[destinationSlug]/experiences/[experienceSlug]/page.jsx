import { notFound } from "next/navigation";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import Breadcrumbs from "@/components/Breadcrumbs";
import ContentViewTracker from "@/components/ContentViewTracker";
import { resolveImageUrl } from "@/lib/imageUrl";
import { Card, CardContent } from "@/components/ui/card";
import RichTextReadOnly from "@/components/RichTextReadOnly";
import { getExperienceByDestinationSlugsPublic } from "@/lib/data/public/experiences";
import { fmtJPY } from "@/lib/format";
import GygWidget from "@/components/GygWidget";
import {
  countryPath,
  destinationPath,
  destinationSectionPath,
} from "@/lib/routes";

export const revalidate = 300;
export const runtime = "nodejs";

export async function generateMetadata(props) {
  const { countrySlug, destinationSlug, experienceSlug } =
    (await props.params) || {};
  const result = await getExperienceByDestinationSlugsPublic({
    countrySlug,
    destinationSlug,
    experienceSlug,
  });
  if (!result?.experience || !result?.destination) return {};
  const countryName = result.destination?.countries?.name || "";
  const destinationName = result.destination?.name || "";
  const title = countryName
    ? `${result.experience.name} | ${destinationName}, ${countryName} | Seawhere`
    : `${result.experience.name} | ${destinationName} | Seawhere`;
  return {
    title,
    description:
      result.experience.summary ||
      `Book ${result.experience.name} in ${destinationName}.`,
  };
}

export default async function ExperienceBySlugPage(props) {
  const { countrySlug, destinationSlug, experienceSlug } =
    (await props.params) || {};
  const { debug } = (await props.searchParams) || {};
  const result = await getExperienceByDestinationSlugsPublic({
    countrySlug,
    destinationSlug,
    experienceSlug,
  });
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      {experience?.id ? (
        <ContentViewTracker type="experience" id={experience.id} />
      ) : null}
      <Breadcrumbs
        items={[
          { label: "Countries", href: countryPath() },
          {
            label: destination?.countries?.name || "Country",
            href: countryPath(countrySlug),
          },
          {
            label: destination?.name || "Destination",
            href: destinationPath(countrySlug, destinationSlug),
          },
          {
            label: "Experiences",
            href: destinationSectionPath(
              countrySlug,
              destinationSlug,
              "experiences"
            ),
          },
          { label: experience?.name || "Experience" },
        ]}
      />

      {!experience && debug ? (
        <pre className="rounded-md border bg-muted p-3 text-xs overflow-x-auto">
          {JSON.stringify({ experienceSlug, result }, null, 2)}
        </pre>
      ) : null}

      <div className="flex items-center justify-between pt-2">
        <h1 className="text-3xl md:text-4xl font-medium text-center md:text-left flex-1">
          {experience?.name || "Experience"}
        </h1>
        <Link
          href={destinationSectionPath(
            countrySlug,
            destinationSlug,
            "experiences"
          )}
          className="underline ml-4"
        >
          Back
        </Link>
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
                          href={destinationPath(countrySlug, destinationSlug)}
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
                    className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground"
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
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Popular tours</h2>
          <GygWidget tourId={experience.gyg_id} />
        </section>
      ) : null}
    </main>
  );
}
