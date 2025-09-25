import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { getRouteParams } from "@/lib/route-params";

export const dynamic = "force-dynamic";

export default async function LoginPage(props) {
  const { searchParams } = await getRouteParams(props);
  // Server-side: if already authed and authorized, redirect to target immediately.
  try {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
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
        const target = typeof raw === "string" && raw.startsWith("/") ? raw : "/admin";
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
