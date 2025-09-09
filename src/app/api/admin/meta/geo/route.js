import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const [regionsRes, prefsRes, divsRes] = await Promise.all([
      supabase.from("regions").select("id,name,slug,order_index").order("order_index", { ascending: true }),
      supabase.from("prefectures").select("id,name,slug,region_id,order_index").order("order_index", { ascending: true }),
      supabase.from("divisions").select("id,name,slug,prefecture_id,order_index").order("order_index", { ascending: true }),
    ]);

    const err = regionsRes.error || prefsRes.error || divsRes.error;
    if (err) return NextResponse.json({ error: err.message }, { status: 400 });

    return NextResponse.json({
      regions: regionsRes.data || [],
      prefectures: prefsRes.data || [],
      divisions: divsRes.data || [],
    });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

