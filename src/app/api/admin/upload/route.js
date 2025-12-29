import { NextResponse } from "next/server";
import { getDB } from "@/lib/supabase/server";
import { buildMediaUrl, putR2Object } from "@/lib/r2";

export const runtime = "nodejs";
export const revalidate = 0;

export async function POST(request) {
  try {
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

    const origName = file.name || "upload.bin";
    const ext = origName.includes(".") ? origName.split(".").pop() : "bin";
    const base = origName.replace(/\.[^.]+$/, "");
    const safeBase = base
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .slice(0, 48);
    const key = `${prefix}/${Date.now()}-${safeBase}.${ext}`;

    const ab = await file.arrayBuffer();
    const body = Buffer.from(ab);
    await putR2Object({
      key,
      body,
      contentType: file.type || "application/octet-stream",
      cacheControl: "public, max-age=31536000, immutable",
    });

    const publicUrl = buildMediaUrl(key);
    if (!publicUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_MEDIA_BASE_URL for media URLs" },
        { status: 500 }
      );
    }
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
