/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production build configuration
  output: process.env.BUILD_STANDALONE ? 'standalone' : 'export',

  // Static export configuration for Netlify
  ...(process.env.BUILD_STANDALONE ? {} : {
    trailingSlash: true,
  }),

  // Enable SWC minification for better performance
  swcMinify: true,

  // Compress output for production
  compress: true,

  // Generate build manifest for deployment
  generateBuildId: async () => {
    return `stratford-ai-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
  },

  // TypeScript configuration
  // TODO: Re-enable after fixing all type errors
  typescript: {
    ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          // Performance headers
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Image optimization
  images: process.env.BUILD_STANDALONE ? {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  } : {
    unoptimized: true,
  },

  // Experimental features
  experimental: {
    typedRoutes: true,
    // optimizeCss disabled due to critters module issue
    // optimizeCss: true,
    webVitalsAttribution: ['CLS', 'LCP', 'FCP', 'FID', 'TTFB', 'INP'],
  },

  // Environment variables for build time
  env: {
    STRATFORD_RANDOM_SEED: '42',
    STRATFORD_VERSION: '1.0.0',
    BUILD_TIME: new Date().toISOString(),
  },

  // Bundle analyzer (enabled with ANALYZE=true)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true,
        })
      );
      return config;
    },
  }),
}

module.exports = nextConfig
