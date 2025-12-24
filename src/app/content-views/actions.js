"use server";

import { getPublicDB } from "@/lib/supabase/public";

export async function incrementView(type, id) {
  if (!type || !id) return;
  const db = getPublicDB();
  const { error } = await db.rpc("increment_view", { p_type: type, p_id: id });
  if (error && process.env.NODE_ENV !== "production") {
    console.warn("Failed to increment view", {
      type,
      id,
      message: error.message,
    });
  }
}
