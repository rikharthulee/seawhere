/**
 * Centralised server-side Supabase client.
 *
 * ✅ This is the ONLY place in the codebase where `createServerClient`
 * from "@supabase/ssr" should be imported directly.
 * All other server code must use `getDB()` from this file.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
