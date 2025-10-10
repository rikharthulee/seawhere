import SectionHeaderSkeleton from "@/components/skeletons/SectionHeaderSkeleton";
import SimpleGridSkeleton from "@/components/skeletons/SimpleGridSkeleton";
import Skeleton from "@/components/ui/skeleton";

export default function SightsByDestinationLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <SectionHeaderSkeleton titleWidth="w-64" />
      <SimpleGridSkeleton />
      <section className="mt-10 space-y-3">
        <Skeleton className="h-6 w-40 bg-muted/60" aria-hidden />
        <Skeleton className="h-40 w-full rounded-xl bg-muted/40" aria-hidden />
      </section>
    </main>
  );
}
