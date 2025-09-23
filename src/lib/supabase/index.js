import { cookies } from "next/headers";
import { createServerClient, createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import env from "../../../lib/env";

const { SUPABASE_URL, SUPABASE_ANON, SUPABASE_SERVICE } = env;

export function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL(), SUPABASE_ANON(), {
    cookies: {
      get(name) {
        const value = cookieStore.get(name)?.value;
        return value ?? undefined;
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (_) {}
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0, path: "/" });
        } catch (_) {}
      },
    },
  });
}

export function getServiceSupabase() {
  return createClient(SUPABASE_URL(), SUPABASE_SERVICE(), {
    auth: { persistSession: false },
  });
}

export function getBrowserSupabase() {
  return createBrowserClient(SUPABASE_URL(), SUPABASE_ANON());
}
