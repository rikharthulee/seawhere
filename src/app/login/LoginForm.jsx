"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  // Compute normalized redirect target from query params
  function getRedirectTarget() {
    const raw = searchParams.get("redirect") || "/admin";
    const normalized = raw.replace(/^\/?admin\/accommodations\b/, "/admin/accommodation");
    return normalized.startsWith("/") ? normalized : "/admin";
  }

  // If already signed in, or once auth state changes to SIGNED_IN, push immediately
  // This avoids waiting on any server cookie sync or network latency.
  useEffect(() => {
    // Check session via server; if authed, redirect immediately
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const json = await res.json();
        if (json?.user) {
          const target = getRedirectTarget();
          window.location.replace(target);
        }
      } catch {}
    })();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const resp = await fetch("/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setErrorMsg(json?.error || "Sign-in failed");
        return;
      }

      const redirect = getRedirectTarget();
      window.location.replace(redirect);
      return;
    } catch (err) {
      setErrorMsg("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReset() {
    setErrorMsg("");
    setResetMsg("");
    if (!email) {
      setErrorMsg("Enter your email to reset password.");
      return;
    }
    try {
      const res = await fetch("/auth/reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrorMsg(json?.error || "Could not send reset email.");
        return;
      }
      setResetMsg("Password reset email sent. Check your inbox.");
    } catch (e) {
      setErrorMsg("Could not send reset email. Try again.");
    }
  }

  return (
    <div className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Login</h1>
      {searchParams.get("unauthorized") ? (
        <p className="rounded border border-yellow-300 bg-yellow-50 p-2 text-sm text-yellow-800">
          Your account is not authorized for admin access.
        </p>
      ) : null}
      {searchParams.get("reset") === "done" ? (
        <p className="rounded border border-green-300 bg-green-50 p-2 text-sm text-green-800">
          Password updated. Please sign in with your new password.
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          className="w-full rounded border p-2"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full rounded border p-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {errorMsg ? (
          <p className="text-sm text-red-600">{errorMsg}</p>
        ) : null}
        {resetMsg ? (
          <p className="text-sm text-green-600">{resetMsg}</p>
        ) : null}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign In"}
        </Button>
      </form>
      <Button type="button" variant="link" onClick={handleSendReset} className="p-0 h-auto">
        Forgot password?
      </Button>
      <p className="text-xs text-neutral-500">
        Note: Access to the admin area requires your profile role to be
        set to "admin" or "editor".
      </p>
    </div>
  );
}
