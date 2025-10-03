export function siteUrl() {
  // During Next build (static prerender), prefer relative URLs so internal
  // route handlers are resolved without a live network server.
  try {
    if (process.env.NEXT_PHASE === 'phase-production-build') return '';
  } catch {}
  const env = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL;
  if (env && typeof env === "string") return env.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel && typeof vercel === "string") return `https://${vercel}`.replace(/\/+$/, "");
  return "http://localhost:3000";
}
