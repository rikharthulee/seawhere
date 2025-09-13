"use client";
import Image from "next/image";
import { resolveImageUrl, resolveImageProps } from "@/lib/imageUrl";

// Hosts allowed by next.config images.remotePatterns
const SUPABASE_HOST = (() => {
  try {
    const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return u ? new URL(u).hostname : null;
  } catch {
    return null;
  }
})();
const SUPABASE_ASSETS_HOST = (() => {
  try {
    const u = process.env.NEXT_PUBLIC_SUPABASE_ASSETS_URL;
    return u ? new URL(u).hostname : null;
  } catch {
    return null;
  }
})();
const ALLOWED_HOSTS = new Set([
  SUPABASE_HOST,
  SUPABASE_ASSETS_HOST,
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
  const resolved = resolveImageUrl(s) || s;
  const external = isExternal(resolved);
  const host = external ? hostnameFor(resolved) : null;
  const allowed = !external || (host && ALLOWED_HOSTS.has(host));
  const blurDataURL = resolveImageProps(resolved, { width, height })?.blurDataURL;
  // For disallowed external hosts, avoid proxy to prevent server timeouts; render native <img> directly
  const proxied = resolved;

  if (allowed) {
    return (
      <Image
        src={proxied}
        alt={alt}
        className={className}
        {...(fill ? { fill: true } : { width, height })}
        sizes={sizes}
        priority={priority}
        placeholder={blurDataURL ? "blur" : undefined}
        blurDataURL={blurDataURL}
      />
    );
  }

  // Disallowed external host: render native img directly (bypasses Next/Image domain checks and proxy)
  return <img src={resolved} alt={alt} className={className} {...(!fill ? { width, height } : {})} loading={priority ? "eager" : "lazy"} decoding="async"/>;
}
