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
