import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";

export async function GET() {
  const db = await getDB();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  const { data, error: dbErr } = await supabase
    .from("experiences")
    .select("id")
    .limit(1);
  return NextResponse.json({
    authed: !!user,
    userErr: userErr?.message ?? null,
    dbOk: !dbErr,
    dbErr: dbErr?.message ?? null,
  });
}
