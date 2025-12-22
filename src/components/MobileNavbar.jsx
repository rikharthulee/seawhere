"use client";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/**
 * Mobile-only slide-down panel for site navigation.
 * Expects parent to control the `open` state via burger button.
 */
export default function MobileNavbar({
  open,
  setOpen,
  navItems = [],
  aboutItems = [],
  onSearchSubmit,
  searchOpen,
  setSearchOpen,
}) {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div
      className={`lg:hidden transition-[max-height,opacity] duration-300 ${
        open
          ? "max-h-screen opacity-100 overflow-y-auto"
          : "max-h-0 opacity-0 overflow-hidden"
      }`}
    >
      <div className="px-4 pb-4 bg-background text-foreground">
        <ul className="flex flex-col gap-2">
          {navItems.map((l) => (
            <li key={l.href}>
              <Link
                className="block rounded-lg px-3 py-2 hover:bg-accent"
                href={l.href}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}

          <li>
            <button
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-accent"
              onClick={() => setAboutOpen((v) => !v)}
              aria-expanded={aboutOpen}
              aria-controls="mobile-about-panel"
            >
              <span>About</span>
              <svg
                className={`h-4 w-4 transition-transform ${
                  aboutOpen ? "rotate-180" : "rotate-0"
                }`}
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
            </button>
            <div
              id="mobile-about-panel"
              className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
                aboutOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <ul className="mt-1 ml-2 flex flex-col gap-1 border-l border-border">
                {aboutItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      className="block rounded-lg px-3 py-2 hover:bg-accent"
                      href={item.href}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        </ul>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Search Seawhere</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
            <Input
              name="q"
              type="search"
              placeholder="Search destinations, sights, tours..."
              className="flex-1"
              autoFocus
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              Search
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
