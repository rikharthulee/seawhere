import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Sights from "@/components/Sights";
import { getDestinationBySlugsPublic } from "@/lib/data/public/destinations";
import { listSightsByDestinationId } from "@/lib/data/public/sights";
import { countryPath, destinationPath, destinationSectionPath } from "@/lib/routes";

export const revalidate = 300;
export const runtime = "nodejs";

export async function generateMetadata(props) {
  const { countrySlug, destinationSlug } = (await props.params) || {};
  const destination = await getDestinationBySlugsPublic(countrySlug, destinationSlug);
  if (!destination) return {};
  const countryName = destination?.countries?.name || "";
  const title = countryName
    ? `Sights in ${destination.name}, ${countryName} | Seawhere`
    : `Sights in ${destination.name} | Seawhere`;
  return {
    title,
    description: `Top sights to visit in ${destination.name}.`,
  };
}

export default async function DestinationSightsPage(props) {
  const { countrySlug, destinationSlug } = (await props.params) || {};
  const destination = await getDestinationBySlugsPublic(countrySlug, destinationSlug);
  if (!destination) notFound();

  const sights = await listSightsByDestinationId(destination.id);
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
            label: "Sights",
            href: destinationSectionPath(countrySlug, destinationSlug, "sights"),
          },
        ]}
      />

      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">
          Sights in {destination.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Curated temples, museums, viewpoints, and landmarks.
        </p>
      </div>

      <Sights
        items={sights}
        countrySlug={countrySlug}
        destinationSlug={destinationSlug}
      />
    </main>
  );
}
