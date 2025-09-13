import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }) {
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
        const sp = await searchParams;
        const raw = (sp && typeof sp === "object" ? sp.redirect : null) || "/admin";
        const target = typeof raw === "string" && raw.startsWith("/") ? raw : "/admin";
        redirect(target);
      }
    }
  } catch {}

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
