import FoodDrink from "@/components/FoodDrink";
import { listPublishedFoodDrink } from "@/lib/data/public/food-drink";
import ExploreFilters from "@/components/ExploreFilters";
import { listCountriesPublic } from "@/lib/data/public/geo";
import { listPublishedDestinations } from "@/lib/data/public/destinations";

export const revalidate = 300;
export const runtime = "nodejs";

export default async function FoodDrinkPage() {
  const rows = await listPublishedFoodDrink();
  const [countries, destinations] = await Promise.all([
    listCountriesPublic(),
    listPublishedDestinations(),
  ]);
  const items = Array.isArray(rows)
    ? rows.map((r) => ({
        slug: r.slug,
        title: r.name,
        description: r.description || null,
        images: Array.isArray(r.images) ? r.images : [],
      }))
    : [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <ExploreFilters
        countries={countries}
        destinations={destinations}
        tags={["cafes", "night markets", "fine dining", "street food"]}
      />
      <div className="mt-8">
        <FoodDrink items={items} />
      </div>
    </main>
  );
}
