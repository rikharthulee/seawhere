import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const revalidate = 0;

export async function POST(request) {
  try {
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE;
    if (!bucket || !url) {
      return NextResponse.json(
        {
          error:
            "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_BUCKET",
        },
        { status: 500 }
      );
    }

    const db = await getDB();
    const { data: auth } = await db.auth.getUser();
    const user = auth?.user || null;
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await request.formData();
    const file = form.get("file");
    const prefix = String(form.get("prefix") || "destinations");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!serviceKey) {
      return NextResponse.json(
        { error: "Missing SUPABASE_SERVICE_ROLE on server for upload" },
        { status: 500 }
      );
    }

    const svc = createServiceClient(url, serviceKey);
    const origName = file.name || "upload.bin";
    const ext = origName.includes(".") ? origName.split(".").pop() : "bin";
    const base = origName.replace(/\.[^.]+$/, "");
    const safeBase = base
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .slice(0, 48);
    const key = `${prefix}/${Date.now()}-${safeBase}.${ext}`;

    // Convert to ArrayBuffer to avoid any runtime/env Blob issues
    const ab = await file.arrayBuffer();
    const bytes = new Uint8Array(ab);
    const { error } = await svc.storage.from(bucket).upload(key, bytes, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    const publicUrl = `${url}/storage/v1/object/public/${bucket}/${key}`;
    return NextResponse.json(
      { ok: true, key, url: publicUrl },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
