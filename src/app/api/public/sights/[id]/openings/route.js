import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const svc = createClient(url, key);
    // Ensure sight is published
    const { data: sight, error: sErr } = await svc
      .from("sights")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 400 });
    if (!sight || sight.status !== "published") return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [{ data: hours, error: hErr }, { data: exceptions, error: eErr }] = await Promise.all([
      svc
        .from("sight_opening_hours")
        .select("weekday, idx, open_time, close_time, is_closed, valid_from, valid_to")
        .eq("sight_id", id)
        .order("weekday", { ascending: true })
        .order("idx", { ascending: true }),
      svc
        .from("sight_opening_exceptions")
        .select("date, is_closed, open_time, close_time, note")
        .eq("sight_id", id)
        .order("date", { ascending: true }),
    ]);
    const err = hErr || eErr;
    if (err) return NextResponse.json({ error: err.message }, { status: 400 });
    return NextResponse.json({ hours: hours || [], exceptions: exceptions || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
