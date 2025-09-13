/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAssetsUrl = process.env.NEXT_PUBLIC_SUPABASE_ASSETS_URL;
let remotePatterns = [];
try {
  if (supabaseUrl) {
    const host = new URL(supabaseUrl).hostname;
    remotePatterns.push({
      protocol: 'https',
      hostname: host,
      pathname: '/storage/v1/object/public/**',
    });
    // Also allow signed and render paths if used
    remotePatterns.push({
      protocol: 'https',
      hostname: host,
      pathname: '/storage/v1/object/sign/**',
    });
    remotePatterns.push({
      protocol: 'https',
      hostname: host,
      pathname: '/storage/v1/render/image/**',
    });
  }
  if (supabaseAssetsUrl) {
    const host = new URL(supabaseAssetsUrl).hostname;
    remotePatterns.push({ protocol: 'https', hostname: host, pathname: '/storage/v1/object/public/**' });
    remotePatterns.push({ protocol: 'https', hostname: host, pathname: '/storage/v1/object/sign/**' });
    remotePatterns.push({ protocol: 'https', hostname: host, pathname: '/storage/v1/render/image/**' });
  }
} catch {}

const nextConfig = {
  images: {
    remotePatterns: [
      ...remotePatterns,
      // Allow placeholder images used in seed data
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'gravatar.com' },
      { protocol: 'https', hostname: 'secure.gravatar.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    formats: ['image/avif','image/webp'],
    minimumCacheTTL: 60,
  },
  poweredByHeader: false,
  compress: true,
  httpAgentOptions: { keepAlive: true },
  async redirects() {
    return [
      {
        source: '/locations',
        destination: '/destinations',
        permanent: true,
      },
      {
        source: '/locations/:slug',
        destination: '/destinations/:slug',
        permanent: true,
      },
      {
        source: '/admin/locations',
        destination: '/admin/destinations',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
