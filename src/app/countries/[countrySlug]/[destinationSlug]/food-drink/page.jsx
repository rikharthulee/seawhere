import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import FoodDrink from "@/components/FoodDrink";
import { getDestinationBySlugsPublic } from "@/lib/data/public/destinations";
import { listFoodDrinkByDestinationId } from "@/lib/data/public/food-drink";
import { countryPath, destinationPath, destinationSectionPath } from "@/lib/routes";

export const revalidate = 300;
export const runtime = "nodejs";

export async function generateMetadata(props) {
  const { countrySlug, destinationSlug } = (await props.params) || {};
  const destination = await getDestinationBySlugsPublic(countrySlug, destinationSlug);
  if (!destination) return {};
  const countryName = destination?.countries?.name || "";
  const title = countryName
    ? `Food & Drink in ${destination.name}, ${countryName} | Seawhere`
    : `Food & Drink in ${destination.name} | Seawhere`;
  return {
    title,
    description: `Where to eat and drink in ${destination.name}.`,
  };
}

export default async function DestinationFoodDrinkPage(props) {
  const { countrySlug, destinationSlug } = (await props.params) || {};
  const destination = await getDestinationBySlugsPublic(countrySlug, destinationSlug);
  if (!destination) notFound();

  const items = await listFoodDrinkByDestinationId(destination.id);
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
            label: "Food & Drink",
            href: destinationSectionPath(
              countrySlug,
              destinationSlug,
              "food-drink"
            ),
          },
        ]}
      />

      <div>
        <h1 className="text-3xl md:text-4xl font-semibold">
          Food &amp; Drink in {destination.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Hand-picked cafes, restaurants, and bars in this destination.
        </p>
      </div>

      <FoodDrink
        items={items}
        countrySlug={countrySlug}
        destinationSlug={destinationSlug}
      />
    </main>
  );
}
