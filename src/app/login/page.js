import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage(props) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  // Server-side: if already authed and authorized, redirect to target immediately.
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    const json = await res.json();
    const user = json?.user || null;
    if (user) {
      // Keep redirect scope minimal here; detailed role checks happen in admin layout/middleware
      const role = user?.role || user?.app_metadata?.role || null;
      if (!role || ["admin", "editor"].includes(role)) {
        const raw =
          searchParams && typeof searchParams === "object"
            ? searchParams.redirect
            : null;
        const fallback = "/admin";
        const target =
          typeof raw === "string" && raw.startsWith("/") ? raw : "/admin";
        redirect(target || fallback);
      }
    }
  } catch {}

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
