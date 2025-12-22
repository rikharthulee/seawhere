import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Experiences from "@/components/Experiences";
import { getDestinationBySlugsPublic } from "@/lib/data/public/destinations";
import { listExperiencesByDestinationId } from "@/lib/data/public/experiences";
import { countryPath, destinationPath, destinationSectionPath } from "@/lib/routes";

export const revalidate = 300;
export const runtime = "nodejs";

export async function generateMetadata(props) {
  const { countrySlug, destinationSlug } = (await props.params) || {};
  const destination = await getDestinationBySlugsPublic(countrySlug, destinationSlug);
  if (!destination) return {};
  const countryName = destination?.countries?.name || "";
  const title = countryName
    ? `Experiences in ${destination.name}, ${countryName} | Seawhere`
    : `Experiences in ${destination.name} | Seawhere`;
  return {
    title,
    description: `Experiences and activities in ${destination.name}.`,
  };
}

export default async function DestinationExperiencesPage(props) {
  const { countrySlug, destinationSlug } = (await props.params) || {};
  const destination = await getDestinationBySlugsPublic(countrySlug, destinationSlug);
  if (!destination) notFound();

  const experiences = await listExperiencesByDestinationId(destination.id);
  const country = destination.countries || null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Countries", href: countryPath() },
          {
            label: country?.name || "Country",
            href: countryPath(countrySlug),
          },
          {
            label: destination.name,
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
        ]}
      />

      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">
          Experiences in {destination.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Classes, shows, and activities curated for this destination.
        </p>
      </div>

      <Experiences
        items={experiences}
        countrySlug={countrySlug}
        destinationSlug={destinationSlug}
      />
    </main>
  );
}
