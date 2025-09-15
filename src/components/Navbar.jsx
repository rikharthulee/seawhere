"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import CallNowButton from "./CallNowButton";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DesktopBannerNav from "@/components/DesktopBannerNav";
import MobileNavbar from "@/components/MobileNavbar";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [user, setUser] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();
  // Keep banner height consistent between image size and padding space
  const bannerH = 120; // px

  // Track auth state and show Sign out when logged in
  useEffect(() => {
    let mounted = true;
    async function prime() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const session = data.session;
      setIsAuthed(!!session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setUserName(
          session.user.user_metadata?.name || session.user.email || ""
        );
        setAvatarUrl("");
      } else {
        setUserName("");
        setAvatarUrl("");
      }
    }
    prime();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsAuthed(!!session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setUserName(
            session.user.user_metadata?.name || session.user.email || ""
          );
          setAvatarUrl("");
        } else {
          setUserName("");
          setAvatarUrl("");
        }
      }
    );
    return () => {
      mounted = false;
      sub.subscription?.unsubscribe();
    };
  }, [supabase]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      // Hit server route to clear auth cookies for SSR/middleware
      await fetch("/auth/signout", { method: "POST" });
    } catch (_) {
      // fall back to client sign out
      try {
        await supabase.auth.signOut();
      } catch (_) {}
    }
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
    { href: "/fooddrink", label: "Food & Drink" },
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
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-sm border-b">
      <nav className="mx-auto max-w-6xl px-4 py-2">
        <div className="flex items-center justify-between lg:hidden">
          {/* Burger (mobile only) */}
          <button
            className="inline-flex items-center justify-center rounded-md p-2 ring-1 ring-black/10"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {/* Icon swaps between burger and close */}
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
          <div />
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
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded bg-black text-white px-3 py-1 text-sm hover:opacity-80 disabled:opacity-60 whitespace-nowrap"
            title="Sign out"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : null}

      <DesktopBannerNav
        links={computedLinks}
        isAuthed={isAuthed}
        bannerH={bannerH}
      />

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
