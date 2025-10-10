import CardGridSkeleton from "@/components/skeletons/CardGridSkeleton";

export default function SightsLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <CardGridSkeleton title="Sights" sectionId="sights" showCredit={false} count={9} />
    </main>
  );
}
