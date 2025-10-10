import FoodDrink from "@/components/FoodDrink";
import { listPublishedFoodDrink } from "@/lib/data/public/food-drink";

export const revalidate = 300;
export const runtime = "nodejs";

export default async function FoodDrinkPage() {
  const rows = await listPublishedFoodDrink();
  const items = Array.isArray(rows)
    ? rows.map((r) => ({
        slug: r.slug,
        title: r.name,
        images: Array.isArray(r.images) ? r.images : [],
        credit: null,
      }))
    : [];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <FoodDrink items={items} />
    </main>
  );
}
