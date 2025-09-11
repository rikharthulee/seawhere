"use client";
import Image from "next/image";
import { resolveImageUrl, resolveImageProps } from "@/lib/imageUrl";
import { supabasePublicKeyFromUrl } from "@/lib/sbImg";

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
  const resolved = resolveImageUrl(s) || s;
  const external = isExternal(resolved);
  const host = external ? hostnameFor(resolved) : null;
  const allowed = !external || (host && ALLOWED_HOSTS.has(host));
  const blurDataURL = resolveImageProps(resolved, { width, height })?.blurDataURL;
  const sbKey = supabasePublicKeyFromUrl(resolved);
  const proxied = sbKey
    ? `/api/img?key=${encodeURIComponent(sbKey)}`
    : external && !allowed
    ? `/api/img?url=${encodeURIComponent(resolved)}`
    : resolved;

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

  // As a last resort (shouldn't hit if proxy works), render native img
  return <img src={proxied} alt={alt} className={className} {...(!fill ? { width, height } : {})} loading={priority ? "eager" : "lazy"} decoding="async"/>;
}
