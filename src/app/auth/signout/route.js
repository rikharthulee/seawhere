import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  const cookieStore = cookies();
  const supabase = createClient({ cookies: cookieStore });
  await supabase.auth.signOut();
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL("/", origin));
}

export async function GET(request) {
  // Allow GET for convenience
  return POST(request);
}
