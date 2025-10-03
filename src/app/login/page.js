import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { redirect } from "next/navigation";
import { getDB } from "@/lib/supabase/server";
import { serverParams } from "@/app/_lib/next15";

export const dynamic = "force-dynamic";

// @page-kind server
export default async function LoginPage(props) {
  const { searchParams } = await serverParams(props);
  // Server-side: if already authed and authorized, redirect to target immediately.
  try {
    const supabase = await getDB();
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
