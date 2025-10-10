import CardGridSkeleton from "@/components/skeletons/CardGridSkeleton";

export default function ToursLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <CardGridSkeleton title="Tours" sectionId="tours" showCredit={false} />
    </main>
  );
}
