"use client";
import Image from "next/image";
import { sbImg, supabasePublicKeyFromUrl } from "@/lib/sbImg";

// Hosts allowed by next.config images.remotePatterns
const SUPABASE_HOST = (() => {
  try {
    const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return u ? new URL(u).hostname : null;
  } catch {
    return null;
  }
})();
const ALLOWED_HOSTS = new Set([
  SUPABASE_HOST,
  "picsum.photos",
  "images.unsplash.com",
  "plus.unsplash.com",
].filter(Boolean));

function isExternal(src) {
  return /^https?:\/\//i.test(src || "");
}

function hostnameFor(src) {
  try {
    return new URL(src).hostname;
  } catch {
    return null;
  }
}

/**
 * SafeImage renders Next <Image> for allowed hosts and local paths.
 * For other remote hosts, it falls back to <img> to avoid Next domain errors.
 */
export default function SafeImage({ src, alt = "", className = "", fill, sizes, width, height, priority = false }) {
  const s = String(src || "");
  const external = isExternal(s);
  const host = external ? hostnameFor(s) : null;
  const allowed = !external || (host && ALLOWED_HOSTS.has(host));
  const sbKey = external ? supabasePublicKeyFromUrl(s) : null;

  if (allowed) {
    return (
      <Image
        src={s}
        alt={alt}
        className={className}
        {...(fill ? { fill: true } : { width, height })}
        sizes={sizes}
        priority={priority}
        {...(sbKey
          ? {
              // Use Supabase transform CDN when source is a Supabase public URL
              loader: ({ width, quality }) => sbImg(sbKey, { width, quality: quality || 80 }),
              unoptimized: true, // we provide fully-formed CDN URL
            }
          : {})}
      />
    );
  }

  // Fallback to native <img> when domain isn't configured
  // When `fill` is requested, rely on the parent container being relative with fixed height
  return (
    <img
      src={s}
      alt={alt}
      className={className}
      {...(!fill ? { width, height } : {})}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
