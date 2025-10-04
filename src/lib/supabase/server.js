/**
 * Centralised server-side Supabase client.
 *
 * ✅ This is the ONLY place in the codebase where `createServerClient`
 * from "@supabase/ssr" should be imported directly.
 * All other server code must use `getDB()` from this file.
 */

"use server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { MutableRequestCookiesAdapter } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export async function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown";
    throw new Error(
      `Missing Supabase env vars in ${env}. Required: NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY`
    );
  }

  // Soft validation: warn if URL host doesn't look like a Supabase project
  try {
    const host = new URL(url).hostname;
    if (!host.endsWith(".supabase.co")) {
      console.error(
        "⚠️ Suspect NEXT_PUBLIC_SUPABASE_URL (host is not *.supabase.co)",
        { url }
      );
    }
  } catch (e) {
    console.error("⚠️ Invalid NEXT_PUBLIC_SUPABASE_URL format", {
      url,
      error: e?.message,
    });
  }

  // Next.js 15: cookies() is async; await the whole call (sync access is deprecated)
  const cookieStore = await cookies();
  const mutableCookies = MutableRequestCookiesAdapter.wrap(cookieStore);

  try {
    return createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return mutableCookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (options) {
              mutableCookies.set({ name, value, ...options });
            } else {
              mutableCookies.set({ name, value });
            }
          });
        },
      },
    });
  } catch (e) {
    console.error("Failed to create Supabase server client", {
      error: e?.message,
    });
    throw e;
  }
}
