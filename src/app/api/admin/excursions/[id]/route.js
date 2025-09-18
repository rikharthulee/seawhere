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

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const client = await getClient();
    const { data: exc, error } = await client
      .from("excursions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!exc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: items } = await client
      .from("excursion_items")
      .select("id, item_type, ref_id, sort_order")
      .eq("excursion_id", id)
      .order("sort_order", { ascending: true });

    return NextResponse.json({ ...exc, items: items || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const client = await getClient();
    const body = await request.json();

    const payload = {
      name: body.name,
      maps_url: body.maps_url || null,
      status: body.status || "draft",
      description: body.description || null,
      transport: body.transport || null,
    };
    const { error } = await client.from("excursions").update(payload).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    await client.from("excursion_items").delete().eq("excursion_id", id);
    const rows = (Array.isArray(body.items) ? body.items : [])
      .filter((it) => ["sight", "experience", "tour"].includes(it.item_type))
      .map((it) => ({
        excursion_id: id,
        item_type: it.item_type,
        ref_id: it.ref_id,
        sort_order: Number(it.sort_order) || 0,
      }));
    if (rows.length > 0) {
      const { error: itemsErr } = await client.from("excursion_items").insert(rows);
      if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 400 });
    }
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

