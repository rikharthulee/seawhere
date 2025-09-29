import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function PUT(req, ctx) {
  try {
    const { id } = (await ctx.params) || {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await req.json();
    const db = await getDB();
    const { data, error } = await db
      .from("accommodation")
      .update(body)
      .eq("id", id)
      .select("id, slug")
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(
      { ok: true, id: data.id, slug: data.slug },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function DELETE(_req, ctx) {
  try {
    const { id } = (await ctx.params) || {};
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const db = await getDB();
    const { error } = await db.from("accommodation").delete().eq("id", id);

    if (error) {
      const status = error.code === "23503" ? 409 : 400; // foreign key violation
      const friendly =
        error.code === "23503"
          ? "Cannot delete this accommodation because other records reference it (e.g., itineraries). Remove those first or detach their accommodation."
          : error.message;
      return NextResponse.json({ error: friendly }, { status });
    }
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
