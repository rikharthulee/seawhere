"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { resolveImageUrl, resolveImageProps } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";

// Hosts allowed by next.config images.remotePatterns
const ENV_HOSTS = [];
const envUrls = [
  process.env.NEXT_PUBLIC_VERCEL_BLOB_BASE_URL,
  process.env.NEXT_PUBLIC_BLOB_BASE_URL,
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL,
];
for (const url of envUrls) {
  try {
    if (url) {
      const host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname;
      if (host && host.endsWith(".public.blob.vercel-storage.com")) {
        ENV_HOSTS.push(host);
      }
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
export default function SafeImage({
  src,
  alt = "",
  className = "",
  fill,
  sizes,
  width,
  height,
  priority = false,
  loading: loadingProp,
  onLoad: userOnLoad,
  onError: userOnError,
  onLoadingComplete: userOnLoadingComplete,
  ...rest
}) {
  const [fallbackNative, setFallbackNative] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const s = String(src || "");
  const resolved = resolveImageUrl(s) || s;
  const external = isExternal(resolved);
  const host = external ? hostnameFor(resolved) : null;
  const allowed =
    !external ||
    (host &&
      (ALLOWED_HOSTS.has(host) ||
        host.endsWith(".public.blob.vercel-storage.com")));
  const blurDataURL = resolveImageProps(resolved, { width, height })?.blurDataURL;
  // Use Next/Image optimizer for allowed hosts; do not use Supabase transforms
  const finalSrc = resolved;

  useEffect(() => {
    setFallbackNative(false);
    setIsLoaded(false);
  }, [finalSrc]);

  const notifyComplete = (maybeTarget, event) => {
    if (maybeTarget instanceof HTMLImageElement) {
      userOnLoadingComplete?.(maybeTarget);
    } else if (event?.currentTarget instanceof HTMLImageElement) {
      userOnLoadingComplete?.(event.currentTarget);
    } else if (maybeTarget) {
      userOnLoadingComplete?.(maybeTarget);
    }
  };

  const handleNativeLoad = (event) => {
    setIsLoaded(true);
    userOnLoad?.(event);
    notifyComplete(event?.currentTarget, event);
  };

  const handleNativeError = (event) => {
    setIsLoaded(true);
    userOnError?.(event);
  };

  const handleNextLoad = (event) => {
    setIsLoaded(true);
    userOnLoad?.(event);
    notifyComplete(event?.currentTarget, event);
  };

  const handleNextError = (event) => {
    setFallbackNative(true);
    setIsLoaded(false);
    userOnError?.(event);
  };

  const imageClassName = cn(
    "transition-opacity duration-500 ease-out",
    isLoaded ? "opacity-100" : "opacity-0",
    className
  );

  if (allowed && !fallbackNative) {
    return (
      <Image
        src={finalSrc}
        alt={alt}
        className={imageClassName}
        {...(fill ? { fill: true } : { width, height })}
        sizes={sizes}
        priority={priority}
        {...(loadingProp ? { loading: loadingProp } : {})}
        quality={60}
        placeholder={blurDataURL ? "blur" : undefined}
        blurDataURL={blurDataURL}
        onLoad={handleNextLoad}
        onError={handleNextError}
        {...rest}
      />
    );
  }

  // Disallowed external host: render native img directly (bypasses Next/Image domain checks)
  return (
    <img
      src={resolved}
      alt={alt}
      className={imageClassName}
      {...(!fill ? { width, height } : {})}
      sizes={sizes}
      loading={loadingProp ?? (priority ? "eager" : "lazy")}
      decoding="async"
      onLoad={handleNativeLoad}
      onError={handleNativeError}
      {...rest}
    />
  );
}
