"use client";
import { useEffect, useState } from "react";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DesktopBannerNav from "@/components/DesktopBannerNav";
import MobileNavbar from "@/components/MobileNavbar";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [user, setUser] = useState(null);
  const router = useRouter();
  // Track auth state and show Sign out when logged in
  useEffect(() => {
    let mounted = true;
    async function prime() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const json = await res.json();
        if (!mounted) return;
        const u = json?.user || null;
        setIsAuthed(!!u);
        setUser(u);
        if (u) {
          setUserName(u.user_metadata?.name || u.email || "");
          setAvatarUrl("");
        } else {
          setUserName("");
          setAvatarUrl("");
        }
      } catch {}
    }
    prime();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    // Hit server route to clear auth cookies for SSR/middleware
    try { await fetch("/auth/signout", { method: "POST" }); } catch (_) {}
    // Hard redirect to ensure a clean state everywhere
    if (typeof window !== "undefined") {
      // Use replace to avoid back navigation to an authed page
      window.location.replace("/");
      return;
    } else {
      router.replace("/");
      router.refresh();
    }
    setSigningOut(false);
  }

  const links = [
    { href: "/", label: "Home" },
    { href: "/destinations", label: "Destinations" },
    { href: "/sights", label: "Sights" },
    { href: "/tours", label: "Tours" },
    { href: "/accommodation", label: "Accommodation" },
    { href: "/experiences", label: "Experiences" },
    { href: "/transportation", label: "Transportation" },
    { href: "/food-drink", label: "Food & Drink" },
    { href: "/blog", label: "Blog" },
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: "Contact" },
  ];

  // Show Admin link to any authenticated user; access is still enforced
  // by server-side checks in admin layout and middleware.
  const computedLinks = isAuthed
    ? [...links, { href: "/admin", label: "Admin" }]
    : links;

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b lg:static lg:bg-transparent lg:backdrop-blur-0 lg:border-b-0">
      <nav className="mx-auto max-w-6xl px-4 py-2">
        <div className="flex items-center justify-between lg:hidden">
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="JapanMan home"
          >
            <Image
              src="/crane.png"
              alt="JapanMan logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              priority
            />
            <span className="text-lg font-semibold text-foreground">JapanMan</span>
          </Link>

          {/* Burger (mobile only) */}
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
      </nav>

      {/* Top-right user area (always visible when authed) */}
      {isAuthed ? (
        <div className="absolute right-3 top-2 z-20 flex items-center gap-2 pl-2 pr-2">
          {(() => {
            const displayName = userName || user?.email || "";
            const initial = (displayName || "")
              .trim()
              .slice(0, 1)
              .toUpperCase();
            return (
              <>
                {avatarUrl ? (
                  <SafeImage
                    src={avatarUrl}
                    alt="Avatar"
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full object-cover border border-black/10"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-black/10 grid place-items-center text-xs text-black">
                    {initial}
                  </div>
                )}
                <span className="hidden sm:inline text-sm text-black/80 max-w-[12rem] truncate">
                  {displayName}
                </span>
              </>
            );
          })()}
          <Button
            onClick={handleSignOut}
            disabled={signingOut}
            size="sm"
            title="Sign out"
            className="whitespace-nowrap"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      ) : null}

      <DesktopBannerNav links={computedLinks} isAuthed={isAuthed} />

      <MobileNavbar
        open={open}
        setOpen={setOpen}
        links={computedLinks}
        isAuthed={isAuthed}
        userName={userName}
        avatarUrl={avatarUrl}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />
    </header>
  );
}
