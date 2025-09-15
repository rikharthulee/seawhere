"use client";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Desktop-only banner + black nav bar.
 * Groups key site sections under a shadcn dropdown: “Explore Japan”
 */
export default function DesktopBannerNav({ links, isAuthed, bannerH = 120 }) {
  const exploreHrefs = new Set([
    "/destinations",
    "/sights",
    "/tours",
    "/accommodation",
    "/experiences",
    "/fooddrink",
  ]);

  const exploreDescriptions = {
    "/destinations": "Cities, regions & itineraries",
    "/sights": "Temples, museums, viewpoints",
    "/tours": "Guided tours & tickets",
    "/accommodation": "Hotels, ryokan & hostels",
    "/experiences": "Classes, shows & activities",
    "/fooddrink": "Eat & drink: ramen to kaiseki",
  };

  const exploreItems = links.filter((l) => exploreHrefs.has(l.href));
  const topLevel = links.filter((l) => !exploreHrefs.has(l.href));

  return (
    <div
      className="hidden lg:block relative"
      style={{ paddingTop: `${bannerH}px` }}
    >
      {/* Skyline banner */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 pointer-events-none select-none z-10"
        style={{ height: `${bannerH}px`, width: "100%" }}
      >
        <div className="relative" style={{ height: "100%", width: "100%" }}>
          <SafeImage
            src="/banner.svg"
            alt="Banner"
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Black link bar */}
      <div className="bg-black">
        <div className="mx-auto max-w-6xl py-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
            <div />
            <div className="flex justify-center items-center gap-6 text-white">
              {/* Explore Japan dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded px-2 py-1 text-white hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-white/50">
                  Explore Japan
                  <svg
                    className="h-4 w-4"
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
                <DropdownMenuContent align="start" className="min-w-[220px]">
                  {exploreItems.map((l) => (
                    <DropdownMenuItem key={l.href} asChild className="py-2">
                      <Link href={l.href} className="block">
                        <div className="text-sm leading-tight flex items-center gap-1">
                          <span>{l.label}</span>
                          <span className="text-xs text-muted-foreground">
                            - {exploreDescriptions[l.href] || "Explore more"}
                          </span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* The rest as top-level links */}
              {topLevel.map((l) => (
                <Link key={l.href} className="hover:opacity-80" href={l.href}>
                  {l.label}
                </Link>
              ))}

              {/* Login (if not authed) */}
              {!isAuthed ? (
                <Link className="hover:opacity-80" href="/login">
                  Login
                </Link>
              ) : null}
            </div>
            <div className="flex justify-end items-center gap-3 pr-4 pl-4 flex-nowrap min-w-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
