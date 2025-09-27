import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getRouteParams } from "@/lib/route-params";

export const dynamic = "force-dynamic";

export default async function LoginPage(props) {
  const { searchParams } = await getRouteParams(props);
  // Server-side: if already authed and authorized, redirect to target immediately.
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile && ["admin", "editor"].includes(profile.role)) {
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
