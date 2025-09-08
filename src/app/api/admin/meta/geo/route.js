import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Optional: check user role to restrict access to admins/editors
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: prefectures, error: pErr } = await supabase
      .from("prefectures")
      .select("id, name, slug, region_id, order_index")
      .order("order_index", { ascending: true });
    if (pErr) throw pErr;

    const { data: divisions, error: dErr } = await supabase
      .from("divisions")
      .select("id, name, slug, prefecture_id, order_index")
      .order("order_index", { ascending: true });
    if (dErr) throw dErr;

    return NextResponse.json({ prefectures: prefectures || [], divisions: divisions || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
