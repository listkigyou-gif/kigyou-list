import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  htmlLimitedBots: /.*/,
  cacheMaxMemorySize: 15 * 1024 * 1024, // 15MB hard cap (Nginx handles primary HTTP micro-caching)
  async redirects() {
    return [
      {
        source: '/index.html/:path*',
        destination: '/ja/:path*',
        permanent: true,
      },
      {
        source: '/index.html',
        destination: '/ja',
        permanent: true,
      },
      {
        source: '/:locale(ja|en|vi)/tools/ai-sales-list',
        destination: '/:locale/guide/ai-sales-list',
        permanent: true,
      },
      {
        source: '/tools/ai-sales-list',
        destination: '/ja/guide/ai-sales-list',
        permanent: true,
      },
      {
        source: '/:locale(ja|en|vi)/blog/:path*',
        destination: '/:locale/guide',
        permanent: true,
      },
      {
        source: '/:locale(ja|en|vi)/blog',
        destination: '/:locale/guide',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/sitemap-index.xml',
      },
    ];
  },
  async headers() {
    return [
      {
        // Cache search page on Cloudflare for 60 seconds
        source: '/:locale(ja|en|vi)/search',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        // Cache company detail pages on Cloudflare for 5 minutes
        source: '/:locale(ja|en|vi)/company/:id',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
