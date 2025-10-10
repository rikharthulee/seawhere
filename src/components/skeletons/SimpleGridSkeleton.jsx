import Skeleton from "@/components/ui/skeleton";

export default function SimpleGridSkeleton({ count = 6, aspect = "aspect-[4/3]" }) {
  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="rounded-xl border border-border/60 overflow-hidden">
          <div className={`relative bg-muted ${aspect}`}>
            <Skeleton className="absolute inset-0 h-full w-full bg-muted/60" aria-hidden />
          </div>
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4 bg-muted/50" aria-hidden />
            <Skeleton className="h-4 w-full bg-muted/40" aria-hidden />
          </div>
        </div>
      ))}
    </div>
  );
}
