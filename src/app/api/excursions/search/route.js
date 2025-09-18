import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

async function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  if (url && serviceKey) return createClient(url, serviceKey);
  const cookieStore = await cookies();
  return createRouteHandlerClient({ cookies: () => cookieStore });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Number(searchParams.get("limit") || 8);
    const db = await getClient();

    const like = q ? `%${q}%` : null;

    async function run(kind, table) {
      let qb = db
        .from(table)
        .select("id, name, destination_id, destinations ( name )")
        .eq("status", "published")
        .order("name", { ascending: true })
        .limit(limit);
      if (like) qb = qb.ilike("name", like);
      const { data } = await qb;
      return (data || []).map((r) => ({
        id: r.id,
        name: r.name,
        kind,
        destination: r?.destinations?.name || null,
      }));
    }

    const [sights, experiences, tours] = await Promise.all([
      run("sight", "sights"),
      run("experience", "experiences"),
      run("tour", "tours"),
    ]);

    const items = [...sights, ...experiences, ...tours].slice(0, limit * 3);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

