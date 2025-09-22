"use client";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DesktopSkylineBanner from "@/components/DesktopSkylineBanner";

/**
 * Desktop-only banner + black nav bar.
 * Groups key site sections under a shadcn dropdown: “Explore Japan”
 */
export default function DesktopBannerNav({
  links,
  isAuthed,
  bannerH = 120,
  bannerScale = 1.8,
}) {

  const exploreHrefs = new Set([
    "/destinations",
    "/sights",
    "/tours",
    "/accommodation",
    "/experiences",
    "/fooddrink",
  ]);

  const exploreDescriptions = {
    "/destinations": "Towns, cities and rural locations",
    "/sights": "Temples, museums, viewpoints",
    "/tours": "Guided tours & tickets",
    "/accommodation": "Hotels, ryokan and boutiques",
    "/experiences": "Classes, shows & activities",
    "/fooddrink": "Eat & drink: ramen to kaiseki",
  };

  const exploreItems = links.filter((l) => exploreHrefs.has(l.href));
  const topLevel = links.filter((l) => !exploreHrefs.has(l.href));

  return (
    <>
      <DesktopSkylineBanner bannerH={bannerH} scale={bannerScale} />

      {/* Sticky tokenized link bar */}
      <div className="hidden lg:block sticky top-0 z-30 bg-[#1C1917]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-b-xl bg-primary text-primary-foreground shadow-sm">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 py-2">
              <div />
              <div className="flex justify-center items-center gap-6">
                {/* Explore Japan dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded px-2 py-1 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring">
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
    </>
  );
}
