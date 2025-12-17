import Experiences from "@/components/Experiences";
// Fetch via API (ISR)
import { listPublishedExperiences } from "@/lib/data/public/experiences";
import ExploreFilters from "@/components/ExploreFilters";
import { listCountriesPublic } from "@/lib/data/public/geo";
import { listPublishedDestinations } from "@/lib/data/public/destinations";

export default async function ExperiencesPage() {
  const items = await listPublishedExperiences();
  const [countries, destinations] = await Promise.all([
    listCountriesPublic(),
    listPublishedDestinations(),
  ]);
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <ExploreFilters
        countries={countries}
        destinations={destinations}
        tags={["adventure", "wellness", "nightlife", "culture"]}
      />
      <div className="mt-8">
        <Experiences items={items} />
      </div>
    </main>
  );
}
export const revalidate = 300;
export const runtime = "nodejs";
