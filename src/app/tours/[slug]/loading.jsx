import Skeleton from "@/components/ui/skeleton";

export default function TourLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 bg-muted/70" aria-hidden />
          <Skeleton className="h-5 w-20 bg-muted/60" aria-hidden />
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <Skeleton className="h-72 w-full rounded-xl bg-muted/60 md:col-span-2" aria-hidden />
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-lg border border-border/60 p-3 space-y-3">
            <Skeleton className="h-4 w-36 bg-muted/50" aria-hidden />
            <Skeleton className="h-4 w-full bg-muted/40" aria-hidden />
            <Skeleton className="h-4 w-3/4 bg-muted/40" aria-hidden />
            <div className="flex justify-end">
              <Skeleton className="h-9 w-28 rounded-md bg-primary/40" aria-hidden />
            </div>
          </div>
          <Skeleton className="h-4 w-5/6 bg-muted/40" aria-hidden />
          <Skeleton className="h-24 w-full rounded-xl bg-muted/40" aria-hidden />
          <div className="flex flex-wrap gap-2">
            {[...Array(4)].map((_, idx) => (
              <Skeleton key={idx} className="h-6 w-16 rounded-full bg-muted/40" aria-hidden />
            ))}
          </div>
          <Skeleton className="h-48 w-full rounded-xl bg-muted/40" aria-hidden />
        </div>
      </section>

      <section className="space-y-4">
        <Skeleton className="h-6 w-48 bg-muted/60" aria-hidden />
        <Skeleton className="h-40 w-full rounded-xl bg-muted/50" aria-hidden />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[0, 1].map((idx) => (
          <div key={idx} className="rounded-lg border border-border/60 p-4 space-y-3">
            <Skeleton className="h-6 w-32 bg-muted/50" aria-hidden />
            <Skeleton className="h-4 w-full bg-muted/40" aria-hidden />
            <Skeleton className="h-4 w-3/4 bg-muted/40" aria-hidden />
          </div>
        ))}
      </section>
    </main>
  );
}
