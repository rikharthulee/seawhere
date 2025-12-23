"use server";

import { getPublicDB } from "@/lib/supabase/public";

export async function incrementView(type, id) {
  if (!type || !id) return;
  const db = getPublicDB();
  await db.rpc("increment_view", { type, id });
}
