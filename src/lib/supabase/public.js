import { createClient } from "@supabase/supabase-js";

export function getPublicDB() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
