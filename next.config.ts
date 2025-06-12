import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      },
      {
        protocol: 'https',
        hostname: '**.feiyuyu.net',
      },
      {
        protocol: 'https',
        hostname: '**.d.run',
      }
    ],
  },
  // Ensure proper handling of rewrites for our custom routing
  async rewrites() {
    return [
      // This will be handled by middleware, but we define it here for clarity
      {
        source: '/',
        destination: '/en',
      },
    ];
  },
};

export default withNextIntl(nextConfig);
