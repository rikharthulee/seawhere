import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";

export async function POST(request) {
  const supabase = await getDB();
  await supabase.auth.signOut();
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL("/", origin));
}

export async function GET(request) {
  // Allow GET for convenience
  return POST(request);
}
