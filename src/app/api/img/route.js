import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || "";

const ALLOWED_HOSTS = new Set([
  (() => { try { return new URL(BASE).hostname; } catch { return null; } })(),
  "images.unsplash.com",
  "plus.unsplash.com",
  "picsum.photos",
  "gravatar.com",
  "secure.gravatar.com",
  "lh3.googleusercontent.com",
].filter(Boolean));

function buildObjectUrlFromKey(key) {
  const k = String(key || "").replace(/^\/+/, "");
  if (!BASE || !BUCKET || !k) return null;
  return `${BASE}/storage/v1/object/public/${BUCKET}/${k}`;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const urlParam = searchParams.get("url");

    let upstream = null;
    if (key) {
      upstream = buildObjectUrlFromKey(key);
    } else if (urlParam) {
      try {
        const u = new URL(urlParam);
        if (!ALLOWED_HOSTS.has(u.hostname)) {
          return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }
        upstream = u.toString();
      } catch {}
    }

    if (!upstream) return placeholder(400);

    // Fetch with timeout to avoid long hangs on first load
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(upstream, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      cache: "force-cache",
      signal: controller.signal,
    });
    clearTimeout(t);

    if (!res.ok || !res.body) {
      return placeholder(res.status || 502);
    }

    const headers = new Headers(res.headers);
    headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=43200");
    if (!headers.get("Content-Type")) headers.set("Content-Type", "image/jpeg");

    return new Response(res.body, { status: 200, headers });
  } catch (e) {
    return placeholder(504);
  }
}

export const runtime = 'nodejs';

function placeholder(status = 200) {
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
  const buf = Buffer.from(base64, "base64");
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "X-Img-Status": String(status),
    },
  });
}
