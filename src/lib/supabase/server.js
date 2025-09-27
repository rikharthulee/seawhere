import { createServerClient as createSupaServerClient } from "@supabase/ssr";

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
        const { cookies } = await import("next/headers");
        const store = await cookies(); // ✅ await in RSC
        return store.getAll();
      },
      async setAll(cookiesToSet) {
        const { cookies } = await import("next/headers");
        const store = await cookies(); // ✅ await in RSC
        cookiesToSet.forEach(({ name, value, options }) => {
          store.set({ name, value, ...options });
        });
      },
    },
  });
}
