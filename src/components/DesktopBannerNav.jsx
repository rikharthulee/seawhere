"use client";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";

/**
 * Desktop-only banner with destination-centric navigation + search.
 */
export default function DesktopBannerNav({ navItems = [], aboutItems = [], onSearchSubmit }) {
  const pathname = usePathname();

  return (
    <div className="hidden lg:block border-b bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-6 px-4 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-foreground"
        >
          <Image
            src="/logo.png"
            alt="Seawhere logo"
            width={56}
            height={56}
            className="h-14 w-14 object-contain"
            priority
          />
          <span>SEAwhere</span>
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-6 text-base font-semibold text-foreground/80">
          {navItems.map((l) => (
            <Link
              key={l.href}
              className={`group relative rounded px-2 py-1 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                l.label === "Destinations" && pathname?.startsWith("/countries")
                  ? "text-foreground"
                  : ""
              }`}
              href={l.href}
            >
              <span className="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100 group-focus-visible:scale-x-100" />
              {l.label}
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger className="group inline-flex items-center gap-1 rounded px-2 py-1 transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40">
              About
              <svg
                className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.146l3.71-3.915a.75.75 0 011.08 1.04l-4.24 4.47a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[200px]">
              {aboutItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild className="py-2">
                  <Link href={item.href} className="block">
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex justify-end">
          <form
            className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 shadow-sm"
            onSubmit={onSearchSubmit}
          >
            <svg
              className="h-4 w-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <Input
              name="q"
              type="search"
              placeholder="Search destinations, sights, tours..."
              className="h-8 w-56 border-0 bg-transparent px-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <button type="submit" className="text-xs font-semibold text-primary">
              Search
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
