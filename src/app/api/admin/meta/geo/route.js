import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";
export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDB();

    const [countriesRes, destinationsRes] = await Promise.all([
      db
        .from("countries")
        .select("id,name,slug,iso_code,default_currency")
        .order("name", { ascending: true }),
      db
        .from("destinations")
        .select("id,name,slug,country_id,status")
        .order("name", { ascending: true }),
    ]);

    const err = countriesRes.error || destinationsRes.error;
    if (err) return NextResponse.json({ error: err.message }, { status: 400 });

    return NextResponse.json(
      {
        countries: countriesRes.data || [],
        destinations: destinationsRes.data || [],
        regions: [],
        prefectures: [],
        divisions: [],
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
