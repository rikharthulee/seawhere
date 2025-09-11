const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET;

export function resolveImageUrl(path) {
  if (!path || typeof path !== "string") return null;
  if (/^https?:\/\//i.test(path)) return path;
  // Handle values stored as storage public path without domain
  if (path.startsWith("/storage/v1/object/public/")) {
    return SUPABASE_URL ? `${SUPABASE_URL}${path}` : path;
  }
  if (path.startsWith("storage/v1/object/public/")) {
    return SUPABASE_URL ? `${SUPABASE_URL}/${path}` : `/${path}`;
  }
  // If a leading slash is present but it refers to a storage key like
  // "/destinations/..." or "/accommodation/..." (or legacy "/locations/..."),
  // treat it as a key within the public bucket rather than a site-relative file.
  if (path.startsWith("/")) {
    const trimmed = path.replace(/^\/+/, "");
    if (
      trimmed.startsWith("destinations/") ||
      trimmed.startsWith("accommodation/") ||
      trimmed.startsWith("locations/")
    ) {
      if (SUPABASE_URL && SUPABASE_BUCKET) {
        return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${trimmed}`;
      }
      return `/${trimmed}`;
    }
    // Otherwise assume it's a file in /public
    return path;
  }
  if (SUPABASE_URL && SUPABASE_BUCKET) {
    // Treat the provided value as an exact key inside the public bucket.
    // No automatic prefixing — caller must provide full key like
    // "destinations/tokyo/thumb.jpg" or "/destinations/tokyo/thumb.jpg".
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
  }
  // As a last resort, treat as public/ relative path
  return `/${path}`;
}

// --- Blur helpers for Next/Image -------------------------------------------
function shimmer(width = 700, height = 475) {
  return `\n<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">\n  <defs>\n    <linearGradient id="g">\n      <stop stop-color="#f6f7f8" offset="20%"/>\n      <stop stop-color="#edeef1" offset="50%"/>\n      <stop stop-color="#f6f7f8" offset="70%"/>\n    </linearGradient>\n  </defs>\n  <rect width="${width}" height="${height}" fill="#f6f7f8"/>\n  <rect id="r" width="${width}" height="${height}" fill="url(#g)"/>\n  <animate xlink:href="#r" attributeName="x" from="-${width}" to="${width}" dur="1s" repeatCount="indefinite"  />\n</svg>`;
}

function toBase64(str) {
  if (typeof window === "undefined") {
    return Buffer.from(str).toString("base64");
  }
  return btoa(unescape(encodeURIComponent(str)));
}

export function resolveImageProps(input, opts = {}) {
  const src = resolveImageUrl(input);
  if (!src) return null;
  const { width, height, alt, priority } = opts;
  const w = width || 700;
  const h = height || 475;
  const blurDataURL = `data:image/svg+xml;base64,${toBase64(shimmer(w, h))}`;
  return {
    src,
    placeholder: "blur",
    blurDataURL,
    width,
    height,
    alt,
    priority,
  };
}
