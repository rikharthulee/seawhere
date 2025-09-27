import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
    let data, error;
    if (url && serviceKey) {
      const svc = createClient(url, serviceKey);
      const res = await svc
        .from("destinations")
        .select("id, name, slug, status, prefecture_id, division_id")
        .order("name", { ascending: true });
      data = res.data; error = res.error;
    } else {
      const cookieStore = cookies();
      const supabase = createClient({ cookies: cookieStore });
      const res = await supabase
        .from("destinations")
        .select("id, name, slug, status, prefecture_id, division_id")
        .order("name", { ascending: true });
      data = res.data; error = res.error;
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ items: data || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
