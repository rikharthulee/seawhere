import * as React from "react";
import { cn } from "@/lib/utils";

const Skeleton = React.forwardRef(function Skeleton({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
});

export default Skeleton;
