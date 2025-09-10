import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data, error } = await supabase
      .from("accommodation")
      .update(body)
      .eq("id", id)
      .select("id, slug")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { error } = await supabase.from("accommodation").delete().eq("id", id);
    if (error) {
      const status = error.code === "23503" ? 409 : 400; // foreign key violation
      const friendly = error.code === "23503"
        ? "Cannot delete this accommodation because other records reference it (e.g., itineraries). Remove those first or detach their accommodation."
        : error.message;
      return NextResponse.json({ error: friendly }, { status });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
