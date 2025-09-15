"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "@/lib/utils"

function DropdownMenu({ ...props }) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger({ className, ...props }) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

function DropdownMenuPortal(props) {
  return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}

function DropdownMenuContent({ className, sideOffset = 4, align = "start", ...props }) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover text-popover-foreground p-1 shadow-md",
          className
        )}
        {...props}
      />
    </DropdownMenuPortal>
  )
}

function DropdownMenuItem({ className, inset, ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-black/5 focus:bg-black/5",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}
