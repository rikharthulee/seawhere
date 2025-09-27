import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
    );
  }
  return { url, anonKey };
}

function toCookieAdapter(store) {
  if (!store || typeof store.get !== "function") {
    return undefined;
  }
  return {
    get(name) {
      const cookie = store.get(name);
      if (!cookie) return undefined;
      return typeof cookie === "string" ? cookie : cookie.value;
    },
    set(name, value, options) {
      if (typeof store.set === "function") {
        try {
          store.set(name, value, options);
        } catch (_) {}
      }
    },
    remove(name, options) {
      if (typeof store.delete === "function") {
        try {
          store.delete(name, options);
          return;
        } catch (_) {}
      }
      if (typeof store.set === "function") {
        try {
          store.set(name, "", { ...(options ?? {}), maxAge: 0 });
        } catch (_) {}
      }
    },
  };
}

export function createClient({ cookies } = {}) {
  const { url, anonKey } = getConfig();
  const store =
    typeof cookies === "function"
      ? cookies()
      : cookies ?? (() => {
          try {
            return nextCookies();
          } catch (_) {
            return undefined;
          }
        })();
  const adapter = toCookieAdapter(store);
  return createServerClient(url, anonKey, adapter ? { cookies: adapter } : undefined);
}
