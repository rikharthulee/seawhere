"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import CallNowButton from "./CallNowButton";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();
  // Keep banner height consistent between image size and padding space
  const bannerH = 120; // px

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
        const { data: prof } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, role")
          .eq("id", session.user.id)
          .single();
        setUserName(
          prof?.display_name || session.user.user_metadata?.name || ""
        );
        setAvatarUrl(prof?.avatar_url || "");
        setIsAdmin(["admin", "editor"].includes(prof?.role));
      } else {
        setUserName("");
        setAvatarUrl("");
        setIsAdmin(false);
      }
    }
    prime();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsAuthed(!!session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("display_name, avatar_url, role")
            .eq("id", session.user.id)
            .single();
          setUserName(
            prof?.display_name || session.user.user_metadata?.name || ""
          );
          setAvatarUrl(prof?.avatar_url || "");
          setIsAdmin(["admin", "editor"].includes(prof?.role));
        } else {
          setUserName("");
          setAvatarUrl("");
          setIsAdmin(false);
        }

        // Sync client auth state to server cookies for SSR/admin routes
        try {
          await fetch("/auth/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ event, session }),
          });
        } catch (_) {}
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
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm shadow-sm">
      <nav className="mx-auto max-w-6xl px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Burger (mobile only) */}

            <button
              className="lg:hidden inline-flex items-center justify-center rounded-md p-2 ring-1 ring-black/10"
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
          </div>
          {/* WhatsApp on mobile bar (right side) */}

          {/* <CallNowButton variant="light" className="lg:hidden" /> */}
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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Avatar"
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

      {/* Desktop banner perched on black link bar */}
      {/* Wrapper reserves space above the bar so the banner isn't clipped */}
      <div
        className="hidden lg:block relative"
        style={{ paddingTop: `${bannerH}px` }}
      >
        {/* Skyline glued to top of the bar */}
        <img
          src="/banner.svg"
          alt="Banner"
          className="absolute left-1/2 -translate-x-1/2 top-0 w-auto pointer-events-none select-none z-10"
          style={{ height: `${bannerH}px` }}
        />
        {/* Black link bar (normal height) */}
        <div className="bg-black">
          <div className="mx-auto max-w-6xl py-2">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
              <div />
              <ul className="flex justify-center items-center gap-6 text-white">
                {computedLinks.map((l) => (
                  <li key={l.href}>
                    <Link className="hover:opacity-80" href={l.href}>
                      {l.label}
                    </Link>
                  </li>
                ))}
                {!isAuthed ? (
                  <li>
                    <Link className="hover:opacity-80" href="/login">
                      Login
                    </Link>
                  </li>
                ) : null}
              </ul>
              <div className="flex justify-end items-center gap-3 pr-4 pl-4 flex-nowrap min-w-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      <div
        className={`lg:hidden transition-[max-height,opacity] duration-300 ${
          open
            ? "max-h-screen opacity-100 overflow-y-auto"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="px-4 pb-4">
          <ul className="flex flex-col gap-3">
            {computedLinks.map((l) => (
              <li key={l.href}>
                <Link
                  className="block rounded-lg px-3 py-2 hover:bg-black/5"
                  href={l.href}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            {!isAuthed ? (
              <li>
                <Link
                  className="block rounded-lg px-3 py-2 hover:bg-black/5"
                  href="/login"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
              </li>
            ) : null}
          </ul>
          {isAuthed ? (
            <div className="mt-3">
              <div className="mb-2 flex items-center gap-2">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-black/10 grid place-items-center text-xs">
                    {(userName || "").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="text-sm">{userName}</span>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  handleSignOut();
                }}
                disabled={signingOut}
                className="w-full rounded bg-black text-white px-3 py-2 text-sm disabled:opacity-60"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
