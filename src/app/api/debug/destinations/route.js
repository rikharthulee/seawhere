import { NextResponse } from "next/server";
import { getPublishedDestinations } from "@/lib/data/destinations";

export async function GET() {
  try {
    const rows = await getPublishedDestinations();
    return NextResponse.json({ ok: true, count: rows.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
