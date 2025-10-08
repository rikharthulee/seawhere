import { NextResponse } from "next/server";
import { getPublicDB } from "@/lib/supabase/public";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const raw = (searchParams.get("ids") || "").trim();
  const kinds = (searchParams.get("kinds") || "sight,experience,tour").split(
    /[,\s]+/
  );
  const ids = raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ error: "Provide ?ids=<uuid1,uuid2>" }, { status: 400 });
  }

  const pub = getPublicDB();
  const srv = await getDB();

  async function fetchFor(table) {
    const cols = "id, name, status, slug, opening_times_url, images";
    const [pubRes, srvRes] = await Promise.all([
      pub.from(table).select(cols).in("id", ids),
      srv.from(table).select(cols).in("id", ids),
    ]);
    return {
      public_error: pubRes.error?.message || null,
      server_error: srvRes.error?.message || null,
      public_rows: pubRes.data || [],
      server_rows: srvRes.data || [],
    };
  }

  const out = {};
  for (const k of kinds) {
    const t = k.trim().toLowerCase();
    if (!t) continue;
    const table = t === "sight" ? "sights" : t === "experience" ? "experiences" : t === "tour" ? "tours" : null;
    if (!table) continue;
    out[table] = await fetchFor(table);
  }

  return NextResponse.json({ ids, results: out }, { status: 200 });
}

