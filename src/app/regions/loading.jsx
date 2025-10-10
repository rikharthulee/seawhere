import Skeleton from "@/components/ui/skeleton";

export default function RegionsLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <Skeleton className="h-10 w-48 bg-muted/70" aria-hidden />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="rounded-lg border border-border/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-28 bg-muted/50" aria-hidden />
              <Skeleton className="h-4 w-12 bg-muted/40" aria-hidden />
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((__, chipIdx) => (
                <Skeleton key={chipIdx} className="h-7 w-20 rounded-full bg-muted/40" aria-hidden />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
