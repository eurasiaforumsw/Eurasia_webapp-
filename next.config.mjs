import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Exclude test scripts from build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'scripts/test-send-message-api': 'commonjs scripts/test-send-message-api',
        'scripts/test-send-message': 'commonjs scripts/test-send-message',
      });
    }
    return config;
  },
};

const sentryOptions = {
  silent: true,
  org: 'efsw',
  project: 'website',
};

const sentryConfig = {
  widenClientFileUpload: true,
  transpileClientSDK: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitoring: true,
};

export default withSentryConfig(
  withBundleAnalyzer(nextConfig),
  sentryOptions,
  sentryConfig
);
