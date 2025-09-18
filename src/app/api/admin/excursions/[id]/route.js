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

    const enriched = await enrichItems(client, items || []);

    return NextResponse.json({ ...exc, items: enriched });
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

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const client = await getClient();
    const { error: itemsErr } = await client
      .from("excursion_items")
      .delete()
      .eq("excursion_id", id);
    if (itemsErr) {
      return NextResponse.json({ error: itemsErr.message }, { status: 400 });
    }
    const { error } = await client.from("excursions").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

const TABLE_BY_KIND = {
  sight: "sights",
  experience: "experiences",
  tour: "tours",
};

async function enrichItems(client, items) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const grouped = items.reduce(
    (acc, item) => {
      if (TABLE_BY_KIND[item.item_type]) {
        acc[item.item_type].add(item.ref_id);
      }
      return acc;
    },
    {
      sight: new Set(),
      experience: new Set(),
      tour: new Set(),
    }
  );

  const detailMaps = {};
  await Promise.all(
    Object.entries(grouped).map(async ([kind, idSet]) => {
      if (idSet.size === 0) return;
      const table = TABLE_BY_KIND[kind];
      const ids = Array.from(idSet);
      const { data } = await client
        .from(table)
        .select("id, name, destinations ( name )")
        .in("id", ids);
      const map = new Map();
      for (const row of data || []) {
        map.set(row.id, {
          name: row.name,
          destination: row?.destinations?.name || null,
        });
      }
      detailMaps[kind] = map;
    })
  );

  return items.map((item) => {
    const detailMap = detailMaps[item.item_type];
    const detail = detailMap ? detailMap.get(item.ref_id) : undefined;
    return {
      ...item,
      name: detail?.name || null,
      destination: detail?.destination || null,
    };
  });
}
