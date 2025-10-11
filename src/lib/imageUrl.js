const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ASSETS_URL = process.env.NEXT_PUBLIC_SUPABASE_ASSETS_URL;
const SUPABASE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET;

function withTrailingSlashRemoved(url = "") {
  return String(url || "").replace(/\/+$/, "");
}

function buildSupabasePublicUrl(relativePath) {
  const base = SUPABASE_ASSETS_URL || SUPABASE_URL;
  if (!base) return null;
  const clean = relativePath.replace(/^\/+/, "");
  return `${withTrailingSlashRemoved(base)}/${clean}`;
}

function buildSupabaseBucketUrl(key) {
  const base = SUPABASE_ASSETS_URL || SUPABASE_URL;
  if (!base || !SUPABASE_BUCKET) return null;
  const cleanKey = key.replace(/^\/+/, "");
  return `${withTrailingSlashRemoved(base)}/storage/v1/object/public/${SUPABASE_BUCKET}/${cleanKey}`;
}

export function resolveImageUrl(path) {
  if (!path || typeof path !== "string") return null;
  const value = path.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/storage/v1/object/public/")) {
    const direct = buildSupabasePublicUrl(value);
    return direct || value;
  }
  if (value.startsWith("storage/v1/object/public/")) {
    const direct = buildSupabasePublicUrl(value);
    return direct || `/${value.replace(/^\/+/, "")}`;
  }
  if (value.startsWith("/")) {
    return value;
  }
  if (
    value.startsWith("media/") ||
    value.startsWith("destinations/") ||
    value.startsWith("accommodation/") ||
    value.startsWith("locations/")
  ) {
    const direct = buildSupabaseBucketUrl(value);
    return direct || `/${value}`;
  }
  return value;
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

export function firstImageFromImages(images) {
  if (!Array.isArray(images) || images.length === 0) return null;
  for (const entry of images) {
    if (!entry) continue;
    if (typeof entry === "string") {
      const resolved = resolveImageUrl(entry);
      if (resolved) return resolved;
    } else if (typeof entry === "object") {
      const candidate = entry.url || entry.src || entry.path || entry.image || null;
      const resolved = candidate ? resolveImageUrl(candidate) : null;
      if (resolved) return resolved;
    }
  }
  return null;
}

export function imagesToGallery(images) {
  if (!Array.isArray(images)) return [];
  return images
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === "string") return resolveImageUrl(entry);
      if (typeof entry === "object") {
        const candidate = entry.url || entry.src || entry.path || entry.image || null;
        return candidate ? resolveImageUrl(candidate) : null;
      }
      return null;
    })
    .filter(Boolean);
}
