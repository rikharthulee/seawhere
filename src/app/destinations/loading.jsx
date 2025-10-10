import CardGridSkeleton from "@/components/skeletons/CardGridSkeleton";

export default function DestinationsLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <CardGridSkeleton title="Destinations" sectionId="destinations" />
    </main>
  );
}
