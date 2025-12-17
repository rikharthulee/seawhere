import Skeleton from "@/components/ui/skeleton";

export default function ExcursionLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-3">
        <Skeleton className="h-10 w-72 bg-muted/70" aria-hidden />
        <Skeleton className="h-4 w-64 bg-muted/50" aria-hidden />
        <div className="flex flex-wrap gap-2">
          {[...Array(4)].map((_, idx) => (
            <Skeleton
              key={idx}
              className="h-6 w-20 rounded-full bg-muted/40"
              aria-hidden
            />
          ))}
        </div>
      </header>

      <Skeleton className="h-72 w-full rounded-xl bg-muted/60" aria-hidden />

      <section className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
        <Skeleton className="h-5 w-32 bg-muted/50" aria-hidden />
        <Skeleton className="h-4 w-full bg-muted/40" aria-hidden />
        <Skeleton className="h-4 w-3/4 bg-muted/40" aria-hidden />
      </section>

      <section className="space-y-3">
        <Skeleton className="h-7 w-40 bg-muted/60" aria-hidden />
        {[...Array(4)].map((_, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-border/60 bg-card/40 p-4 space-y-3"
          >
            <div className="flex items-start gap-4">
              <Skeleton
                className="h-16 w-16 rounded-full bg-muted/50"
                aria-hidden
              />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24 bg-muted/40" aria-hidden />
                <Skeleton className="h-4 w-full bg-muted/30" aria-hidden />
                <Skeleton className="h-4 w-4/5 bg-muted/30" aria-hidden />
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-16 bg-muted/30" aria-hidden />
                  <Skeleton className="h-3 w-20 bg-muted/30" aria-hidden />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
