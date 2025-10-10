import Skeleton from "@/components/ui/skeleton";

export default function DetailPageSkeleton({
  title = "Loading…",
  backHref,
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      <div className="border-t-2 border-border pt-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 bg-muted/70" aria-hidden />
          {backHref ? (
            <Skeleton className="h-5 w-24 bg-muted/60" aria-hidden />
          ) : null}
        </div>
        <div className="border-b-2 border-border mt-3" />
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <Skeleton className="h-80 w-full rounded-xl bg-muted/60 md:col-span-2" aria-hidden />
        <Skeleton className="h-40 w-full rounded-xl bg-muted/40" aria-hidden />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full bg-muted/40" aria-hidden />
          <Skeleton className="h-4 w-3/4 bg-muted/40" aria-hidden />
          <Skeleton className="h-4 w-2/3 bg-muted/40" aria-hidden />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 bg-muted/50" aria-hidden />
          <Skeleton className="h-4 w-40 bg-muted/40" aria-hidden />
          <Skeleton className="h-4 w-28 bg-muted/40" aria-hidden />
        </div>
      </section>
    </main>
  );
}
