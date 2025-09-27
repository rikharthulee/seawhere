import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await getServerSupabase();
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
