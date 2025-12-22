import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Tours from "@/components/Tours";
import { getDestinationBySlugsPublic } from "@/lib/data/public/destinations";
import { listToursByDestinationId } from "@/lib/data/public/tours";
import { countryPath, destinationPath, destinationSectionPath } from "@/lib/routes";

export const revalidate = 300;
export const runtime = "nodejs";

export async function generateMetadata(props) {
  const { countrySlug, destinationSlug } = (await props.params) || {};
  const destination = await getDestinationBySlugsPublic(countrySlug, destinationSlug);
  if (!destination) return {};
  const countryName = destination?.countries?.name || "";
  const title = countryName
    ? `Tours in ${destination.name}, ${countryName} | Seawhere`
    : `Tours in ${destination.name} | Seawhere`;
  return {
    title,
    description: `Tours and tickets in ${destination.name}.`,
  };
}

export default async function DestinationToursPage(props) {
  const { countrySlug, destinationSlug } = (await props.params) || {};
  const destination = await getDestinationBySlugsPublic(countrySlug, destinationSlug);
  if (!destination) notFound();

  const tours = await listToursByDestinationId(destination.id);
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
            label: "Tours",
            href: destinationSectionPath(countrySlug, destinationSlug, "tours"),
          },
        ]}
      />

      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">
          Tours in {destination.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Guided experiences and ticketed highlights.
        </p>
      </div>

      <Tours
        items={tours}
        countrySlug={countrySlug}
        destinationSlug={destinationSlug}
      />
    </main>
  );
}
