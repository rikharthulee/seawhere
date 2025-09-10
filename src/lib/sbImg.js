const PROJECT = process.env.NEXT_PUBLIC_SUPABASE_URL; // https://<ref>.supabase.co
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET; // public bucket name

// Build a Supabase image transformation CDN URL
// path like "folder/file.jpg" relative to the public BUCKET
export function sbImg(path, opts = {}) {
  if (!path) return null;
  if (!PROJECT || !BUCKET) return path;
  const base = `${PROJECT}/storage/v1/render/image/public/${BUCKET}/${String(path).replace(/^\/+/, "")}`;
  const defaults = { width: 1200, quality: 80 };
  const params = new URLSearchParams({ ...defaults, ...opts }).toString();
  return `${base}?${params}`;
}

// Helpers to detect/parse Supabase Storage public URLs
export function supabasePublicKeyFromUrl(src) {
  try {
    const u = new URL(src);
    const host = new URL(PROJECT || "http://invalid").hostname;
    if (u.hostname !== host) return null;
    const mObj = u.pathname.match(/^\/storage\/v1\/object\/public\/(.+?)\/(.+)$/);
    const mRend = u.pathname.match(/^\/storage\/v1\/render\/image\/public\/(.+?)\/(.+)$/);
    const m = mObj || mRend;
    if (!m) return null;
    const bucket = m[1];
    const key = m[2];
    if (BUCKET && bucket !== BUCKET) return null;
    return key;
  } catch {
    return null;
  }
}

