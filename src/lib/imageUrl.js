export function resolveImageUrl(path) {
  if (!path || typeof path !== "string") return null;
  if (/^https?:\/\//i.test(path)) {
    try {
      const u = new URL(path);
      const isSb = u.hostname.endsWith(".supabase.co") && u.pathname.includes("/storage/");
      if (isSb) return `/api/storage/proxy?url=${encodeURIComponent(path)}`;
    } catch {}
    return path;
  }
  // Handle values stored as storage public path without domain
  if (path.startsWith("/storage/v1/object/public/")) {
    const clean = path.replace(/^\/+/, "");
    return `/api/storage/proxy?path=${encodeURIComponent(clean)}`;
  }
  if (path.startsWith("storage/v1/object/public/")) {
    return `/api/storage/proxy?path=${encodeURIComponent(path)}`;
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
      return `/api/storage/proxy?key=${encodeURIComponent(trimmed)}`;
    }
    // Otherwise assume it's a file in /public
    return path;
  }
  // Treat bare keys as bucket-relative public storage keys via proxy
  return `/api/storage/proxy?key=${encodeURIComponent(path)}`;
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
