/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
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
  },
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
