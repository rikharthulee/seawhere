"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setErrorMsg("");
    setMessage("");
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      setMessage("Password updated. You can now sign in.");
      setTimeout(() => router.replace("/login?reset=done"), 800);
    } catch (e) {
      setErrorMsg("Could not update password. Open this page from your email reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Set a New Password</h1>
      <p className="text-sm text-neutral-600">
        If you didn’t reach this page from the password reset email, request a
        new link from the login page.
      </p>
      <form onSubmit={handleUpdatePassword} className="space-y-3">
        <input
          type="password"
          className="w-full rounded border p-2"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full rounded border p-2"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {errorMsg ? (
          <p className="text-sm text-red-600">{errorMsg}</p>
        ) : null}
        {message ? (
          <p className="text-sm text-green-600">{message}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}

