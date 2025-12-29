/** @type {import('next').NextConfig} */
const mediaCandidates = [process.env.NEXT_PUBLIC_MEDIA_BASE_URL];

const mediaRemotePatterns = mediaCandidates
  .map((candidate) => {
    try {
      if (!candidate) return null;
      const value = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
      const { hostname } = new URL(value);
      return { protocol: "https", hostname, pathname: "/**" };
    } catch {
      return null;
    }
  })
  .filter(Boolean);

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.seawhere.com", pathname: "/**" },
      ...mediaRemotePatterns,
      // Allow placeholder images used in seed data
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "gravatar.com" },
      { protocol: "https", hostname: "secure.gravatar.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [60, 70],
    // Cache optimized images on Vercel edge cache for 1 day
    minimumCacheTTL: 60 * 60 * 24,
  },
  poweredByHeader: false,
  compress: true,
  httpAgentOptions: { keepAlive: true },
};

export default nextConfig;
