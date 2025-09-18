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
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const excursionId = data.id;
    const rows = (Array.isArray(body.items) ? body.items : [])
      .filter((it) => ["sight", "experience", "tour"].includes(it.item_type))
      .map((it) => ({
        excursion_id: excursionId,
        item_type: it.item_type,
        ref_id: it.ref_id,
        sort_order: Number(it.sort_order) || 0,
      }));
    if (rows.length > 0) {
      const { error: itemsErr } = await client.from("excursion_items").insert(rows);
      if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 400 });
    }

    return NextResponse.json({ id: excursionId });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

