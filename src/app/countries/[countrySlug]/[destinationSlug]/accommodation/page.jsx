import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Accommodation from "@/components/Accommodation";
import { getDestinationBySlugsPublic } from "@/lib/data/public/destinations";
import { listAccommodationByDestinationId } from "@/lib/data/public/accommodation";
import { countryPath, destinationPath, destinationSectionPath } from "@/lib/routes";

export const revalidate = 300;
export const runtime = "nodejs";

export async function generateMetadata(props) {
  const { countrySlug, destinationSlug } = (await props.params) || {};
  const destination = await getDestinationBySlugsPublic(countrySlug, destinationSlug);
  if (!destination) return {};
  const countryName = destination?.countries?.name || "";
  const title = countryName
    ? `Accommodation in ${destination.name}, ${countryName} | Seawhere`
    : `Accommodation in ${destination.name} | Seawhere`;
  return {
    title,
    description: `Places to stay in ${destination.name}.`,
  };
}

export default async function DestinationAccommodationPage(props) {
  const { countrySlug, destinationSlug } = (await props.params) || {};
  const destination = await getDestinationBySlugsPublic(countrySlug, destinationSlug);
  if (!destination) notFound();

  const items = await listAccommodationByDestinationId(destination.id);
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
            label: "Accommodation",
            href: destinationSectionPath(
              countrySlug,
              destinationSlug,
              "accommodation"
            ),
          },
        ]}
      />

      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">
          Accommodation in {destination.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Hotels, villas, and boutique stays to base your trip.
        </p>
      </div>

      <Accommodation
        items={items}
        countrySlug={countrySlug}
        destinationSlug={destinationSlug}
      />
    </main>
  );
}
