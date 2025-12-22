import CardGridSkeleton from "@/components/skeletons/CardGridSkeleton";

export default function SightLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <CardGridSkeleton title="Sight" sectionId="sight" showCredit={false} />
    </main>
  );
}
