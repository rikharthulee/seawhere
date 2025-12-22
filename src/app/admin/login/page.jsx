import { Suspense } from "react";
import { redirect } from "next/navigation";
import LoginForm from "@/app/login/LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage(props) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    const json = await res.json();
    const user = json?.user || null;
    if (user) {
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
