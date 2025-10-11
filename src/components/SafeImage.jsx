"use client";
import Image from "next/image";
import { useState } from "react";
import { resolveImageUrl, resolveImageProps } from "@/lib/imageUrl";

// Hosts allowed by next.config images.remotePatterns
const ENV_HOSTS = [];
const envUrls = [
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ASSETS_URL,
];
for (const url of envUrls) {
  try {
    if (url) {
      const host = new URL(url).hostname;
      if (host) ENV_HOSTS.push(host);
    }
  } catch {}
}

const STATIC_ALLOWED_HOSTS = new Set([
  "picsum.photos",
  "images.unsplash.com",
  "plus.unsplash.com",
  "gravatar.com",
  "secure.gravatar.com",
  "lh3.googleusercontent.com",
  "public.blob.vercel-storage.com",
]);

const ALLOWED_HOSTS = new Set([...STATIC_ALLOWED_HOSTS, ...ENV_HOSTS]);

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
  const [fallbackNative, setFallbackNative] = useState(false);
  const s = String(src || "");
  const resolved = resolveImageUrl(s) || s;
  const external = isExternal(resolved);
  const host = external ? hostnameFor(resolved) : null;
  const allowed =
    !external ||
    (host &&
      (ALLOWED_HOSTS.has(host) ||
        host.endsWith(".supabase.co") ||
        host.endsWith(".public.blob.vercel-storage.com")));
  const blurDataURL = resolveImageProps(resolved, { width, height })?.blurDataURL;
  // Use Next/Image optimizer for allowed hosts; do not use Supabase transforms
  const finalSrc = resolved;

  if (allowed && !fallbackNative) {
    return (
      <Image
        src={finalSrc}
        alt={alt}
        className={className}
        {...(fill ? { fill: true } : { width, height })}
        sizes={sizes}
        priority={priority}
        quality={60}
        placeholder={blurDataURL ? "blur" : undefined}
        blurDataURL={blurDataURL}
        onError={() => setFallbackNative(true)}
      />
    );
  }

  // Disallowed external host: render native img directly (bypasses Next/Image domain checks)
  return <img src={resolved} alt={alt} className={className} {...(!fill ? { width, height } : {})} loading={priority ? "eager" : "lazy"} decoding="async"/>;
}
