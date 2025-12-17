import Tours from "@/components/Tours";
import { listPublishedTours } from "@/lib/data/public/tours";
import ExploreFilters from "@/components/ExploreFilters";
import { listCountriesPublic } from "@/lib/data/public/geo";
import { listPublishedDestinations } from "@/lib/data/public/destinations";

export default async function ToursPage() {
  const items = await listPublishedTours();
  const [countries, destinations] = await Promise.all([
    listCountriesPublic(),
    listPublishedDestinations(),
  ]);
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <ExploreFilters
        countries={countries}
        destinations={destinations}
        tags={["tours", "tickets", "walking", "food", "history"]}
      />
      <div className="mt-8">
        <Tours items={items} />
      </div>
    </main>
  );
}
export const revalidate = 300;
export const runtime = "nodejs";
