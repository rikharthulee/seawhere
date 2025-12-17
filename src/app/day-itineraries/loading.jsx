import Skeleton from "@/components/ui/skeleton";
import CardGridSkeleton from "@/components/skeletons/CardGridSkeleton";

export default function DayItinerariesLoading() {
  const listPlaceholders = Array.from({ length: 6 });
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-8">
        <Skeleton className="h-9 w-40 bg-muted/70" aria-hidden />
        <Skeleton className="mt-2 h-4 w-64 bg-muted/60" aria-hidden />
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {listPlaceholders.map((_, idx) => (
            <li
              key={idx}
              className="rounded-md border border-dashed border-border/60 p-3"
            >
              <Skeleton className="h-4 w-full bg-muted/50" aria-hidden />
              <Skeleton className="mt-2 h-3 w-16 bg-muted/40" aria-hidden />
            </li>
          ))}
        </ul>
      </section>
      <CardGridSkeleton
        title="Day Itineraries"
        sectionId="day-itineraries"
        showCredit={false}
      />
    </main>
  );
}
