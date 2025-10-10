import Skeleton from "@/components/ui/skeleton";

export default function DestinationLoading() {
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
        <Skeleton className="h-[48vh] min-h-[320px] w-full rounded-xl bg-muted/60 md:col-span-2" aria-hidden />
        <div className="space-y-3 order-2 md:order-1">
          <Skeleton className="h-4 w-full bg-muted/50" aria-hidden />
          <Skeleton className="h-4 w-5/6 bg-muted/50" aria-hidden />
          <Skeleton className="h-4 w-2/3 bg-muted/40" aria-hidden />
          <Skeleton className="h-4 w-3/4 bg-muted/40" aria-hidden />
        </div>
        <div className="order-1 md:order-2">
          <Skeleton className="h-3 w-32 bg-muted/40" aria-hidden />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border/60 p-3 space-y-2">
            <Skeleton className="h-4 w-32 bg-muted/40" aria-hidden />
            <Skeleton className="h-4 w-24 bg-muted/30" aria-hidden />
            <Skeleton className="h-4 w-20 bg-muted/30" aria-hidden />
          </div>
        ))}
      </section>
    </main>
  );
}
