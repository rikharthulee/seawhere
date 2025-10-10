import Skeleton from "@/components/ui/skeleton";

export default function PrefectureLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
        <Skeleton className="h-4 w-16 bg-muted/50" aria-hidden />
        <span>/</span>
        <Skeleton className="h-4 w-20 bg-muted/40" aria-hidden />
        <span>/</span>
        <Skeleton className="h-4 w-24 bg-muted/40" aria-hidden />
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-56 bg-muted/70" aria-hidden />
        <Skeleton className="h-4 w-32 bg-muted/50" aria-hidden />
      </div>

      <section className="space-y-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="rounded-lg border border-border/60 p-4 flex items-center justify-between">
            <Skeleton className="h-5 w-40 bg-muted/50" aria-hidden />
            <Skeleton className="h-4 w-16 bg-muted/40" aria-hidden />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <Skeleton className="h-6 w-64 bg-muted/60" aria-hidden />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-border/60 overflow-hidden">
              <Skeleton className="block h-40 w-full bg-muted/60" aria-hidden />
              <div className="p-3">
                <Skeleton className="h-4 w-32 bg-muted/40" aria-hidden />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
