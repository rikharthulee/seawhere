import CardGridSkeleton from "@/components/skeletons/CardGridSkeleton";

export default function FoodDrinkLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <CardGridSkeleton title="Food &amp; Drink" sectionId="food-drink" showCredit={false} />
    </main>
  );
}
