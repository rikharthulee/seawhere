import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getDB } from "@/lib/supabase/server";

export const runtime = "nodejs";

function sanitizePrefix(input) {
  if (!input || typeof input !== "string") return "images";
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return "images";
  return trimmed
    .replace(/[^a-z0-9/_-]+/gi, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .replace(/\/{2,}/g, "/");
}

function sanitizeFilename(name) {
  if (!name || typeof name !== "string") return "upload.bin";
  const parts = name.split(".");
  const ext = parts.length > 1 ? parts.pop() : null;
  const base = parts.join(".") || "file";
  const safeBase = base.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").slice(0, 64);
  const safeExt = ext ? ext.replace(/[^a-z0-9]+/gi, "").slice(0, 16) : "bin";
  return `${safeBase || "file"}.${safeExt || "bin"}`.toLowerCase();
}

export async function POST(request) {
  try {
    const db = await getDB();
    const { data: auth } = await db.auth.getUser();
    const user = auth?.user || null;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const prefix = sanitizePrefix(form.get("prefix"));
    const safeName = sanitizeFilename(file.name || "");
    const key = `${prefix}/${crypto.randomUUID()}-${safeName}`.replace(/\/{2,}/g, "/");

    const blob = await put(key, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const pathname = blob.pathname.replace(/^\//, "");

    return NextResponse.json(
      {
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        pathname,
        key: pathname,
        contentType: blob.contentType,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Blob upload failed", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
