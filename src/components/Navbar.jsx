"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DesktopBannerNav from "@/components/DesktopBannerNav";
import MobileNavbar from "@/components/MobileNavbar";
import Image from "next/image";
import { countryPath } from "@/lib/routes";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const navItems = [
    { href: countryPath(), label: "Destinations" },
    { href: "/contact", label: "Plan a Trip" },
    { href: "/tours", label: "Tours" },
    { href: "/blog", label: "Blog" },
  ];

  const aboutItems = [
    { href: "/about", label: "About Seawhere" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  function handleSearchSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const raw = String(formData.get("q") || "").trim();
    const target = raw ? `/search?q=${encodeURIComponent(raw)}` : "/search";
    setSearchOpen(false);
    setOpen(false);
    router.push(target);
  }

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b lg:static lg:bg-transparent lg:backdrop-blur-0 lg:border-b-0">
      <nav className="mx-auto max-w-6xl px-4 py-2">
        <div className="flex items-center justify-between lg:hidden">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Seawhere home"
          >
            <Image
              src="/logo.png"
              alt="Seawhere logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              priority
            />
            <span className="text-lg font-semibold text-foreground">SEAwhere</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center justify-center rounded-md p-2 ring-1 ring-black/10"
              aria-label={searchOpen ? "Close search" : "Open search"}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </button>

            <button
              className="inline-flex items-center justify-center rounded-md p-2 ring-1 ring-black/10"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <svg
                className={`h-5 w-5 transition ${open ? "hidden" : "block"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
              <svg
                className={`h-5 w-5 transition ${open ? "block" : "hidden"}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6l-12 12" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <DesktopBannerNav
        navItems={navItems}
        aboutItems={aboutItems}
        onSearchSubmit={handleSearchSubmit}
      />

      <MobileNavbar
        open={open}
        setOpen={setOpen}
        navItems={navItems}
        aboutItems={aboutItems}
        onSearchSubmit={handleSearchSubmit}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
      />
    </header>
  );
}
