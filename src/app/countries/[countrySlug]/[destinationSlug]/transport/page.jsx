import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import { getDestinationBySlugsPublic } from "@/lib/data/public/destinations";
import { countryPath, destinationPath, destinationSectionPath } from "@/lib/routes";

export const revalidate = 300;
export const runtime = "nodejs";

export async function generateMetadata(props) {
  const { countrySlug, destinationSlug } = (await props.params) || {};
  const destination = await getDestinationBySlugsPublic(countrySlug, destinationSlug);
  if (!destination) return {};
  const countryName = destination?.countries?.name || "";
  const title = countryName
    ? `Transport in ${destination.name}, ${countryName} | Seawhere`
    : `Transport in ${destination.name} | Seawhere`;
  return {
    title,
    description: `Getting around ${destination.name}.`,
  };
}

export default async function DestinationTransportPage(props) {
  const { countrySlug, destinationSlug } = (await props.params) || {};
  const destination = await getDestinationBySlugsPublic(countrySlug, destinationSlug);
  if (!destination) notFound();

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
            label: "Transport",
            href: destinationSectionPath(
              countrySlug,
              destinationSlug,
              "transport"
            ),
          },
        ]}
      />

      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">
          Transport in {destination.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Local transport guidance is being curated for this destination.
        </p>
      </div>

      <div className="rounded-xl border bg-muted/50 p-6 text-muted-foreground">
        Detailed routes, stations, and travel tips are coming soon.
      </div>
    </main>
  );
}
