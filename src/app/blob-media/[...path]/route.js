import { NextResponse } from "next/server";

const BLOB_BASE = resolveBlobBase();

export const runtime = "nodejs";

export async function GET(_request, context) {
  const resolvedParams = (await context?.params) || {};
  const segments = Array.isArray(resolvedParams.path) ? resolvedParams.path : [];
  const cleanKey = segments.join("/").replace(/\/+/g, "/");
  if (!cleanKey) {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  if (!BLOB_BASE) {
    return NextResponse.json(
      { error: "Media base URL not configured" },
      { status: 500 }
    );
  }

  const target = `${BLOB_BASE}/${cleanKey.replace(/^\/+/, "")}`;

  let upstream;
  try {
    upstream = await fetch(target);
  } catch (error) {
    return NextResponse.json(
      { error: `Blob fetch failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: passthroughHeaders(upstream.headers),
    });
  }

  const headers = passthroughHeaders(upstream.headers);
  headers.set("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=600");
  headers.set("Access-Control-Allow-Origin", "*");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}

function passthroughHeaders(source) {
  const headers = new Headers();
  const contentType = source.get("Content-Type");
  if (contentType) headers.set("Content-Type", contentType);
  const cacheControl = source.get("Cache-Control");
  if (cacheControl) headers.set("Cache-Control", cacheControl);
  const etag = source.get("ETag");
  if (etag) headers.set("ETag", etag);
  const contentLength = source.get("Content-Length");
  if (contentLength) headers.set("Content-Length", contentLength);
  return headers;
}

function resolveBlobBase() {
  const candidates = [
    process.env.NEXT_PUBLIC_VERCEL_BLOB_BASE_URL,
    process.env.NEXT_PUBLIC_BLOB_BASE_URL,
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL,
    process.env.VERCEL_BLOB_BASE_URL,
    deriveFromToken(process.env.BLOB_READ_WRITE_TOKEN),
  ];

  for (const candidate of candidates) {
    const parsed = normalize(candidate);
    if (parsed) return parsed;
  }
  return null;
}

function normalize(candidate) {
  if (!candidate || typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  const value = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(value);
    if (!url.hostname.endsWith(".public.blob.vercel-storage.com")) return null;
    const basePath = url.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
    return basePath ? `${url.origin}/${basePath}` : url.origin;
  } catch {
    return null;
  }
}

function deriveFromToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.trim().split("_");
  if (parts.length < 4) return null;
  const storeId = parts[3];
  if (!storeId) return null;
  return `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com`;
}
