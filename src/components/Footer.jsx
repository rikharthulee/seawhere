"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function prime() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const json = await res.json();
        if (!mounted) return;
        setIsAuthed(!!json?.user);
      } catch {
        if (mounted) setIsAuthed(false);
      }
    }
    prime();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/auth/signout", { method: "POST" });
    } catch {}
    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
  }

  return (
    <footer className="border-t py-12">
      <div className="mx-auto max-w-6xl px-4 grid gap-8 md:grid-cols-4">
        <div>
          <div className="font-semibold">Seawhere</div>
          <p className="mt-2 text-sm text-neutral-600">
            Bespoke trips across Southeast Asia&apos;s most extraordinary places.
          </p>
        </div>
        <div>
          <div className="font-medium">Get in touch</div>
          <p className="mt-3 text-sm text-neutral-700">hello@seawhere.com</p>
        </div>
        <div>
          <div className="font-medium">Admin</div>
          <div className="mt-3 text-sm text-neutral-700 space-y-2">
            {!isAuthed ? (
              <Link href="/admin/login" className="underline underline-offset-4">
                Admin login
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/admin" className="underline underline-offset-4">
                  Admin dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="text-left text-sm text-neutral-700 underline underline-offset-4 disabled:opacity-60"
                >
                  {signingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 mt-8 text-xs text-neutral-500">
        © {new Date().getFullYear()} Seawhere
      </div>
    </footer>
  );
}
