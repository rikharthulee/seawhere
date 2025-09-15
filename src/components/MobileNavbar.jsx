"use client";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { useState, useMemo } from "react";

/**
 * Mobile-only slide-down panel for site navigation.
 * Expects parent to control the `open` state via burger button.
 */
export default function MobileNavbar({
  open,
  setOpen,
  links,
  isAuthed,
  userName = "",
  avatarUrl = "",
  onSignOut = () => {},
  signingOut = false,
}) {
  const [mobileExploreOpen, setMobileExploreOpen] = useState(false);

  const { exploreItems, topLevel } = useMemo(() => {
    const exploreHrefs = new Set([
      "/destinations",
      "/sights",
      "/tours",
      "/accommodation",
      "/experiences",
      "/fooddrink",
    ]);
    return {
      exploreItems: links.filter((l) => exploreHrefs.has(l.href)),
      topLevel: links.filter((l) => !exploreHrefs.has(l.href)),
    };
  }, [links]);

  return (
    <div
      className={`lg:hidden transition-[max-height,opacity] duration-300 ${
        open
          ? "max-h-screen opacity-100 overflow-y-auto"
          : "max-h-0 opacity-0 overflow-hidden"
      }`}
    >
      <div className="px-4 pb-4">
        <ul className="flex flex-col gap-2">
          {/* Explore Japan collapsible */}
          <li>
            <button
              className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-black/5"
              onClick={() => setMobileExploreOpen((v) => !v)}
              aria-expanded={mobileExploreOpen}
              aria-controls="mobile-explore-panel"
            >
              <span>Explore Japan</span>
              <svg
                className={`h-4 w-4 transition-transform ${
                  mobileExploreOpen ? "rotate-180" : "rotate-0"
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
              id="mobile-explore-panel"
              className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
                mobileExploreOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <ul className="mt-1 ml-2 flex flex-col gap-1 border-l border-black/10">
                {exploreItems.map((l) => (
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
              </ul>
            </div>
          </li>

          {/* Remaining top-level links */}
          {topLevel.map((l) => (
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

          {/* Login (if not authed) */}
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

        {/* Authed block */}
        {isAuthed ? (
          <div className="mt-3">
            <div className="mb-2 flex items-center gap-2">
              {avatarUrl ? (
                <SafeImage
                  src={avatarUrl}
                  alt="Avatar"
                  width={32}
                  height={32}
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
                onSignOut();
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
  );
}
