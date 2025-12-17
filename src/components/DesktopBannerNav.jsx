"use client";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

/**
 * Desktop-only banner + black nav bar.
 * Groups key site sections under a shadcn dropdown: “Explore”
 */
export default function DesktopBannerNav({ links, exploreLinks = [], countries = [], isAuthed }) {
  const exploreDescriptions = {
    "/destinations": "Towns, cities and rural locations",
    "/sights": "Temples, museums, viewpoints",
    "/tours": "Guided tours & tickets",
    "/accommodation": "Hotels, villas and boutiques",
    "/experiences": "Classes, shows & activities",
    "/transportation": "Stations, hubs & travel links",
    "/food-drink": "Eat & drink across SEA",
  };

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
          <DropdownMenu>
            <DropdownMenuTrigger className="group inline-flex items-center gap-1 rounded px-2 py-1 transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/40">
              Countries
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
            <DropdownMenuContent align="start" className="min-w-[240px]">
              {countries.slice(0, 6).map((c) => (
                <DropdownMenuItem key={c.id} asChild className="py-2">
                  <Link href={`/countries/${c.slug}`} className="block">
                    <div className="flex items-center justify-between">
                      <span>{c.name}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild className="py-2">
                <Link href="/countries" className="block font-semibold">
                  Browse all countries
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {exploreLinks.map((l) => (
            <Link
              key={l.href}
              className="group relative rounded px-2 py-1 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              href={l.href}
              title={exploreDescriptions[l.href] || "Explore"}
            >
              <span className="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100 group-focus-visible:scale-x-100" />
              {l.label}
            </Link>
          ))}

          {links
            .filter((l) => l.href !== "/countries")
            .map((l) => (
              <Link
                key={l.href}
                className="group relative rounded px-2 py-1 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                href={l.href}
              >
                <span className="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100 group-focus-visible:scale-x-100" />
                {l.label}
              </Link>
            ))}

          {!isAuthed ? (
            <Link
              className="group relative rounded px-2 py-1 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              href="/login"
            >
              <span className="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-200 group-hover:scale-x-100 group-focus-visible:scale-x-100" />
              Login
            </Link>
          ) : null}
        </div>

        <div className="flex justify-end">
          <span className="hidden h-14 w-14 lg:inline-block" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
