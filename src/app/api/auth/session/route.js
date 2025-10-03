import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDB();
    const { data, error } = await db.auth.getUser();
    const resp = NextResponse.json({ user: error ? null : (data?.user || null) }, { status: 200 });
    resp.headers.set('Cache-Control', 'no-store');
    return resp;
  } catch (e) {
    const resp = NextResponse.json({ user: null }, { status: 200 });
    resp.headers.set('Cache-Control', 'no-store');
    return resp;
  }
}
