/** @type {import('next').NextConfig} */
const blobCandidates = [
  process.env.NEXT_PUBLIC_VERCEL_BLOB_BASE_URL,
  process.env.NEXT_PUBLIC_BLOB_BASE_URL,
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL,
];

const blobRemotePatterns = blobCandidates
  .map((candidate) => {
    try {
      if (!candidate) return null;
      const value = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
      const { hostname } = new URL(value);
      if (!hostname.endsWith(".public.blob.vercel-storage.com")) return null;
      return { protocol: "https", hostname, pathname: "/**" };
    } catch {
      return null;
    }
  })
  .filter(Boolean);

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
      ...blobRemotePatterns,
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
  async redirects() {
    return [
      {
        source: "/locations",
        destination: "/destinations",
        permanent: true,
      },
      {
        source: "/locations/:slug",
        destination: "/destinations/:slug",
        permanent: true,
      },
      {
        source: "/admin/locations",
        destination: "/admin/destinations",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
