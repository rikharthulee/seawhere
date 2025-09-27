import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function getSupabaseForRoute() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_* envs");

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        const resCookies = cookies();
        cookiesToSet.forEach(({ name, value, options }) => {
          resCookies.set(name, value, options);
        });
      },
    },
  });
}

// Handle magic-link / OTP code exchange
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = getSupabaseForRoute();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // After login, send the user to /admin
  return NextResponse.redirect(new URL("/admin", url.origin));
}

// Sync client auth events to server cookies (for SSR/admin checks)
export async function POST(request) {
  const supabase = getSupabaseForRoute();
  const { event, session } = await request.json().catch(() => ({}));

  try {
    if (
      event === "SIGNED_IN" ||
      event === "TOKEN_REFRESHED" ||
      event === "USER_UPDATED"
    ) {
      if (session?.access_token && session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      }
    } else if (event === "SIGNED_OUT") {
      await supabase.auth.signOut();
    }
  } catch (_) {}

  return NextResponse.json({ ok: true });
}
