import Skeleton from "@/components/ui/skeleton";

export default function SectionHeaderSkeleton({
  titleWidth = "w-56",
  showBack = true,
}) {
  return (
    <div className="border-t-2 border-border pt-2">
      <div className="flex items-center justify-between">
        <Skeleton className={`h-10 ${titleWidth} bg-muted/70`} aria-hidden />
        {showBack ? <Skeleton className="h-5 w-20 bg-muted/60" aria-hidden /> : null}
      </div>
      <div className="border-b-2 border-border mt-3" />
    </div>
  );
}
