import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"

function Tile({ asChild = false, className, children, ...props }) {
  const Comp = asChild ? Slot : React.Fragment
  // When asChild, parent should be an anchor/Link; otherwise render a div inside Card
  const inner = asChild ? children : (
    <div className={cn("block focus:outline-none focus:ring-2 focus:ring-ring", className)}>{children}</div>
  )
  return (
    <Card asChild={asChild} className={cn("overflow-hidden transition-shadow hover:shadow-md", className)} {...props}>
      {inner}
    </Card>
  )
}

Tile.Link = function TileLink({ href, className, children, ...props }) {
  return (
    <Tile asChild {...props}>
      <Link href={href} className={cn("block focus:outline-none focus:ring-2 focus:ring-ring", className)}>
        {children}
      </Link>
    </Tile>
  )
}

Tile.Image = function TileImage({ ratio = "4/3", className, children, ...props }) {
  // Accept number (e.g., 16/9) or string like "16/9" | "1/1" | "4/3"
  let r = ratio
  if (typeof r === "string") {
    const m = r.match(/^(\d+)\/(\d+)$/)
    if (m) {
      const w = Number(m[1] || 4)
      const h = Number(m[2] || 3)
      r = h ? w / h : 4 / 3
    } else if (r === "1/1") {
      r = 1
    } else if (r === "16/9") {
      r = 16 / 9
    } else {
      r = 4 / 3
    }
  }
  return (
    <AspectRatio ratio={r} className={cn("relative bg-muted", className)} {...props}>
      <div className="absolute inset-0">{children}</div>
    </AspectRatio>
  )
}

Tile.Content = function TileContent({ className, ...props }) {
  return <CardContent className={cn("p-4", className)} {...props} />
}

export { Tile }
