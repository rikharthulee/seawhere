import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDB();
    const { data, error } = await db.auth.getUser();
    if (error) return NextResponse.json({ user: null }, { status: 200 });
    return NextResponse.json({ user: data?.user || null }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

