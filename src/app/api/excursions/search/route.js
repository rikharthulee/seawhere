import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDB } from "@/lib/supabase/server";

async function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  if (url && serviceKey) return createClient(url, serviceKey);
  const cookieStore = cookies();
  return createClient({ cookies: cookieStore });
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

    const [sights, experiences, tours, accommodation, foodDrink] =
      await Promise.all([
        run("sight", "sights"),
        run("experience", "experiences"),
        run("tour", "tours"),
        run("accommodation", "accommodation"),
        run("food_drink", "food_drink"),
      ]);

    const items = [
      ...sights,
      ...experiences,
      ...tours,
      ...accommodation,
      ...foodDrink,
    ].slice(0, limit * 5);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
