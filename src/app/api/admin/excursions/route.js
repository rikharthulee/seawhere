import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";

async function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
  if (url && serviceKey) return createClient(url, serviceKey);
  const cookieStore = cookies();
  return createClient({ cookies: cookieStore });
}

export async function POST(request) {
  try {
    const client = await getClient();
    const body = await request.json();

    const payload = {
      name: body.name,
      maps_url: body.maps_url || null,
      status: body.status || "draft",
      description: body.description || null,
      transport: body.transport || null,
    };

    const { data, error } = await client
      .from("excursions")
      .insert(payload)
      .select("id")
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    const excursionId = data.id;
    const rows = (Array.isArray(body.items) ? body.items : [])
      .filter((it) =>
        ["sight", "experience", "tour", "accommodation"].includes(it.item_type)
      )
      .map((it) => ({
        excursion_id: excursionId,
        item_type: it.item_type,
        ref_id: it.ref_id,
        sort_order: Number(it.sort_order) || 0,
      }));
    if (rows.length > 0) {
      const { error: itemsErr } = await client
        .from("excursion_items")
        .insert(rows);
      if (itemsErr)
        return NextResponse.json({ error: itemsErr.message }, { status: 400 });
    }

    return NextResponse.json({ id: excursionId });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const client = await getClient();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
    const q = (searchParams.get("q") || "").trim();
    const baseSelect = [
      "id",
      "name",
      "status",
      "updated_at",
      "summary",
      "destination_id",
    ];

    let query = client
      .from("excursions")
      .select(baseSelect.join(","))
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (q) {
      query = query.ilike("name", `%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "42703") {
        const fallbackSelect = baseSelect
          .filter((field) => field !== "updated_at")
          .join(",");
        let fallback = client
          .from("excursions")
          .select(fallbackSelect)
          .order("name", { ascending: true })
          .limit(limit);

        if (q) {
          fallback = fallback.ilike("name", `%${q}%`);
        }

        const { data: fallbackData, error: fallbackError } = await fallback;
        if (fallbackError) {
          return NextResponse.json(
            { error: fallbackError.message },
            { status: 400 }
          );
        }
        return NextResponse.json({ items: fallbackData || [] });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
