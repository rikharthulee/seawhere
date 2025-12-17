import { NextResponse } from "next/server";
import { listCountriesPublic } from "@/lib/data/public/geo";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  try {
    const countries = await listCountriesPublic();
    return NextResponse.json({ countries }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
