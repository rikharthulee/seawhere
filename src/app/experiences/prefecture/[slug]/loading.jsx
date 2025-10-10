import SectionHeaderSkeleton from "@/components/skeletons/SectionHeaderSkeleton";
import SimpleGridSkeleton from "@/components/skeletons/SimpleGridSkeleton";

export default function ExperiencesByPrefectureLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <SectionHeaderSkeleton titleWidth="w-72" />
      <SimpleGridSkeleton />
    </main>
  );
}
