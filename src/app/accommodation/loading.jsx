import CardGridSkeleton from "@/components/skeletons/CardGridSkeleton";

export default function AccommodationLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <CardGridSkeleton title="Accommodation" sectionId="accommodation" />
    </main>
  );
}
