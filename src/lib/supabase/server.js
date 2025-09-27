import { createServerClient as createSupaServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Synchronous for callers; the adapter handles async cookies internally.
export function getDB() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return createSupaServerClient(url, anonKey, {
    cookies: {
      async getAll() {
        const store = await cookies(); // ✅ await in RSC
        return store.getAll();
      },
      async setAll(cookiesToSet) {
        const store = await cookies(); // ✅ await in RSC
        cookiesToSet.forEach(({ name, value, options }) => {
          store.set({ name, value, ...options });
        });
      },
    },
  });
}
