export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req) {
  const url = new URL(req.url);
  const fullUrl = url.searchParams.get("url");
  const path = url.searchParams.get("path");
  const key = url.searchParams.get("key");

  let target = null;
  try {
    if (fullUrl) {
      const u = new URL(fullUrl);
      if (!u.hostname.endsWith(".supabase.co") || !u.pathname.includes("/storage/")) {
        return new Response("Bad Request", { status: 400 });
      }
      target = u.toString();
    } else if (path) {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!base) return new Response("Missing SUPABASE_URL", { status: 500 });
      const clean = path.replace(/^\/+/, "");
      target = `${base}/${clean}`;
    } else if (key) {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET;
      if (!base || !bucket) return new Response("Missing Supabase env", { status: 500 });
      const cleanKey = key.replace(/^\/+/, "");
      target = `${base}/storage/v1/object/public/${bucket}/${cleanKey}`;
    } else {
      return new Response("Bad Request", { status: 400 });
    }
  } catch (_) {
    return new Response("Bad Request", { status: 400 });
  }

  const r = await fetch(target);
  const headers = new Headers();
  const ct = r.headers.get("content-type") || "application/octet-stream";
  headers.set("Content-Type", ct);
  // Allow caching by the platform edge/CDN
  const cache = r.headers.get("cache-control");
  if (cache) headers.set("Cache-Control", cache);
  return new Response(r.body, { status: r.status, headers });
}

