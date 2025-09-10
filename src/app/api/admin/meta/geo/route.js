import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Prefer service role for reliable admin reads (bypass RLS)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
    if (url && serviceKey) {
      const svc = createClient(url, serviceKey);
      const [r, p, d] = await Promise.all([
        svc.from("regions").select("id,name,slug,order_index").order("order_index", { ascending: true }),
        svc.from("prefectures").select("id,name,slug,region_id,order_index").order("order_index", { ascending: true }),
        svc.from("divisions").select("id,name,slug,prefecture_id,order_index").order("order_index", { ascending: true }),
      ]);
      const err = r.error || p.error || d.error;
      if (err) return NextResponse.json({ error: err.message }, { status: 400 });
      return NextResponse.json({ regions: r.data || [], prefectures: p.data || [], divisions: d.data || [] });
    }

    // Fallback: use user session (requires RLS allowing reads for admin/editor)
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const [regionsRes, prefsRes, divsRes] = await Promise.all([
      supabase.from("regions").select("id,name,slug,order_index").order("order_index", { ascending: true }),
      supabase.from("prefectures").select("id,name,slug,region_id,order_index").order("order_index", { ascending: true }),
      supabase.from("divisions").select("id,name,slug,prefecture_id,order_index").order("order_index", { ascending: true }),
    ]);
    const err = regionsRes.error || prefsRes.error || divsRes.error;
    if (err) return NextResponse.json({ error: err.message }, { status: 400 });
    return NextResponse.json({ regions: regionsRes.data || [], prefectures: prefsRes.data || [], divisions: divsRes.data || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
