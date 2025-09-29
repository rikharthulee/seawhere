import { NextResponse } from "next/server";
import { listPublishedDestinations } from "@/lib/data/destinations";

export async function GET() {
  try {
    const rows = await listPublishedDestinations();
    return NextResponse.json({ ok: true, count: rows.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
