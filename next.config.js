/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  images: {
    domains: ['pub-a8b8c132ea704aa8b9c3f39aed29e672.r2.dev'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
  // Ensure pg can work properly with Node.js runtime
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle pg native modules
      config.externals.push('pg', 'pg-native');
    }
    return config;
  },
};

module.exports = nextConfig;
