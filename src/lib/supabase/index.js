import { createServerClient, createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import env from "@/lib/env";

const { SUPABASE_URL, SUPABASE_ANON, SUPABASE_SERVICE } = env;

const PUBLIC_SUPABASE_URL =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined;
const PUBLIC_SUPABASE_ANON_KEY =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined;

function resolveSupabaseParams({ supabaseUrl, supabaseKey } = {}) {
  const isBrowser = typeof window !== "undefined";
  let envUrl = supabaseUrl;
  let envKey = supabaseKey;

  if (!envUrl || !envKey) {
    if (isBrowser) {
      envUrl = envUrl ?? PUBLIC_SUPABASE_URL;
      envKey = envKey ?? PUBLIC_SUPABASE_ANON_KEY;
    } else {
      envUrl = envUrl ?? SUPABASE_URL();
      envKey = envKey ?? SUPABASE_ANON();
    }
  }

  if (!envUrl || !envKey) {
    throw new Error(
      "Supabase configuration missing. Provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or pass supabaseUrl/supabaseKey explicitly.",
    );
  }

  return { supabaseUrl: envUrl, supabaseKey: envKey };
}

function readAllCookies(store) {
  if (!store) return [];
  try {
    const raw = typeof store.getAll === "function" ? store.getAll() : [];
    const list = Array.isArray(raw) ? raw : [];
    return list
      .map((entry) => {
        if (!entry) return null;
        if (typeof entry === "string") return null;
        const name = entry.name ?? entry.key;
        if (!name) return null;
        const value =
          typeof entry.value === "string" ? entry.value : entry.value?.value ?? "";
        return { name, value };
      })
      .filter(Boolean);
  } catch (_) {
    return [];
  }
}

function applyCookie(store, name, value, options) {
  if (!store || !name) return;
  try {
    const maxAge = options && typeof options.maxAge === "number" ? options.maxAge : null;
    const shouldDelete =
      value === null ||
      value === undefined ||
      (value === "" && (maxAge === null ? false : maxAge <= 0)) ||
      (maxAge !== null && maxAge <= 0);
    if (shouldDelete) {
      if (typeof store.delete === "function") {
        store.delete(name, options);
      } else if (typeof store.set === "function") {
        store.set(name, "", { ...(options ?? {}), maxAge: 0 });
      }
      return;
    }
    if (typeof store.set === "function") {
      store.set(name, value, options);
    }
  } catch (_) {}
}

function createCookiesAdapter(getStore, { responseCookies, cookieOptions } = {}) {
  const getResponseStore =
    typeof responseCookies === "function"
      ? responseCookies
      : () => responseCookies;
  return {
    getAll: async () => readAllCookies(getStore?.()),
    setAll: async (setCookies) => {
      if (!Array.isArray(setCookies)) return;
      for (const cookie of setCookies) {
        if (!cookie || !cookie.name) continue;
        const finalOptions = {
          ...(cookieOptions ?? {}),
          ...(cookie.options ?? {}),
        };
        const requestStore = getStore?.();
        if (requestStore) {
          applyCookie(requestStore, cookie.name, cookie.value, finalOptions);
        }
        const responseStore = getResponseStore?.();
        if (responseStore) {
          applyCookie(responseStore, cookie.name, cookie.value, finalOptions);
        }
      }
    },
  };
}

function buildServerClientOptions(baseOptions, cookies) {
  const options = { ...(baseOptions ?? {}) };
  if (cookies) options.cookies = cookies;
  return options;
}

export function createClientComponentClient(config = {}) {
  const { options, ...rest } = config;
  const { supabaseUrl, supabaseKey } = resolveSupabaseParams(rest);
  return createBrowserClient(supabaseUrl, supabaseKey, options);
}

export function createServerComponentClient(context, config = {}) {
  const { cookies } = context ?? {};
  if (typeof cookies !== "function") {
    throw new Error("createServerComponentClient requires a cookies() function");
  }
  const cookiesGetter = () => cookies();
  const { options, cookieOptions, cookieEncoding, ...rest } = config ?? {};
  const { supabaseUrl, supabaseKey } = resolveSupabaseParams(rest);
  const clientOptions = buildServerClientOptions(
    {
      ...(options ?? {}),
      cookieOptions: cookieOptions ?? options?.cookieOptions,
      cookieEncoding: cookieEncoding ?? options?.cookieEncoding,
    },
    createCookiesAdapter(cookiesGetter, { cookieOptions }),
  );
  return createServerClient(supabaseUrl, supabaseKey, clientOptions);
}

export function createRouteHandlerClient(context, config = {}) {
  if (!context || typeof context.cookies !== "function") {
    throw new Error("createRouteHandlerClient requires a cookies() function");
  }
  const { options, cookieOptions, cookieEncoding, ...rest } = config ?? {};
  const { supabaseUrl, supabaseKey } = resolveSupabaseParams(rest);
  const clientOptions = buildServerClientOptions(
    {
      ...(options ?? {}),
      cookieOptions: cookieOptions ?? options?.cookieOptions,
      cookieEncoding: cookieEncoding ?? options?.cookieEncoding,
    },
    createCookiesAdapter(context.cookies, { cookieOptions }),
  );
  return createServerClient(supabaseUrl, supabaseKey, clientOptions);
}

export function createMiddlewareClient(context, config = {}) {
  if (!context?.req || !context?.res) {
    throw new Error("createMiddlewareClient requires { req, res }");
  }
  const { req, res } = context;
  const requestCookiesGetter = () => req.cookies;
  const responseCookiesGetter = () => res.cookies;
  const { options, cookieOptions, cookieEncoding, ...rest } = config ?? {};
  const mergedCookieOptions = {
    httpOnly: false,
    ...(cookieOptions ?? options?.cookieOptions),
  };
  const { supabaseUrl, supabaseKey } = resolveSupabaseParams(rest);
  const clientOptions = buildServerClientOptions(
    {
      ...(options ?? {}),
      cookieOptions: mergedCookieOptions,
      cookieEncoding: cookieEncoding ?? options?.cookieEncoding,
    },
    createCookiesAdapter(requestCookiesGetter, {
      responseCookies: responseCookiesGetter,
      cookieOptions: mergedCookieOptions,
    }),
  );
  return createServerClient(supabaseUrl, supabaseKey, clientOptions);
}

export function createServiceClient() {
  return createClient(SUPABASE_URL(), SUPABASE_SERVICE(), {
    auth: { persistSession: false },
  });
}

export function getBrowserSupabase() {
  return createClientComponentClient();
}

let cachedCookiesFn;

async function ensureCookiesFn() {
  if (cachedCookiesFn !== undefined) return cachedCookiesFn;
  try {
    const mod = await import("next/headers");
    cachedCookiesFn = mod.cookies;
  } catch (_) {
    cachedCookiesFn = null;
  }
  return cachedCookiesFn;
}

export async function getServerSupabase(config = {}) {
  const cookiesFn =
    typeof config?.cookies === "function" ? config.cookies : await ensureCookiesFn();
  if (typeof cookiesFn !== "function") {
    throw new Error("getServerSupabase requires next/headers cookies() to be available");
  }
  return createServerComponentClient({ cookies: cookiesFn }, config);
}
