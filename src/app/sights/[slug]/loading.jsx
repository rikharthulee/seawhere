import Skeleton from "@/components/ui/skeleton";

export default function SightLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-10 w-64 bg-muted/70" aria-hidden />
        <Skeleton className="h-5 w-20 bg-muted/60" aria-hidden />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 lg:gap-8 items-start">
        <div className="space-y-6">
          <Skeleton className="h-72 w-full rounded-xl bg-muted/60" aria-hidden />
          <div className="space-y-4">
            <Skeleton className="h-5 w-3/4 bg-muted/50" aria-hidden />
            <Skeleton className="h-4 w-full bg-muted/40" aria-hidden />
            <Skeleton className="h-4 w-5/6 bg-muted/40" aria-hidden />
            <Skeleton className="h-56 w-full rounded-xl bg-muted/50" aria-hidden />
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32 rounded-md bg-primary/40" aria-hidden />
          </div>
          <div className="space-y-5">
            <Skeleton className="h-24 w-full rounded-xl bg-muted/50" aria-hidden />
            <Skeleton className="h-24 w-full rounded-xl bg-muted/50" aria-hidden />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Skeleton className="h-7 w-40 bg-muted/60" aria-hidden />
        <Skeleton className="h-40 w-full rounded-xl bg-muted/50" aria-hidden />
      </section>

      <section className="mt-4">
        <div className="rounded-lg border border-border/60 p-4 space-y-3">
          <Skeleton className="h-4 w-full bg-muted/40" aria-hidden />
          <Skeleton className="h-4 w-4/5 bg-muted/40" aria-hidden />
          <Skeleton className="h-4 w-2/3 bg-muted/40" aria-hidden />
        </div>
      </section>
    </main>
  );
}
