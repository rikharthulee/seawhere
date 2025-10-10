import Skeleton from "@/components/ui/skeleton";

export default function CardGridSkeleton({
  count = 6,
  title,
  showCredit = true,
  sectionId,
}) {
  const items = Array.from({ length: count });
  return (
    <section id={sectionId}>
      {title ? (
        <div className="border-t-2 border-border pt-2">
          <div className="flex items-end justify-between">
            <h2 className="text-3xl md:text-4xl font-medium">{title}</h2>
          </div>
          <div className="border-b-2 border-border mt-3" />
        </div>
      ) : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {items.map((_, idx) => (
          <article key={idx} className="group">
            <div className="relative overflow-hidden rounded-xl">
              <Skeleton className="h-64 w-full bg-muted/60" />
              <div className="absolute inset-x-3 bottom-3">
                <Skeleton className="h-6 w-40 bg-muted/80" />
              </div>
            </div>
            {showCredit ? (
              <div className="mt-2 flex justify-end">
                <Skeleton className="h-3 w-24 bg-muted/50" />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
