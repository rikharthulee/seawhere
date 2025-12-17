export const runtime = "nodejs";
export const revalidate = 300;

import Sights from "@/components/Sights";
import ExploreFilters from "@/components/ExploreFilters";
import { listPublishedSights } from "@/lib/data/public/sights";
import { listCountriesPublic } from "@/lib/data/public/geo";
import { listPublishedDestinations } from "@/lib/data/public/destinations";

export default async function SightsPage() {
  const items = await listPublishedSights();
  const [countries, destinations] = await Promise.all([
    listCountriesPublic(),
    listPublishedDestinations(),
  ]);
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <ExploreFilters
        countries={countries}
        destinations={destinations}
        tags={["temples", "museums", "viewpoints", "parks"]}
      />
      <div className="mt-8">
        <Sights items={items} />
      </div>
    </main>
  );
}
