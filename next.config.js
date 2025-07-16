/** @type {import('next').NextConfig} */
// Temporarily disable Sentry to fix OpenTelemetry deployment issues
const { withSentryConfig } = { withSentryConfig: (config) => config }

const nextConfig = {
  // Disable experimental features to fix deployment issues
  experimental: {},

  // SWC configuration for JSX
  swcMinify: true,
  compiler: {
    // Enable JSX transform and remove dev-only props in production
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Image optimization
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,

  // Static generation configuration
  staticPageGenerationTimeout: 120,

  // Force all API routes to be dynamic to prevent static generation issues
  async redirects() {
    return []
  },

  // Caching configuration
  async rewrites() {
    return [
      // Cache static assets
      {
        source: '/static/:path*',
        destination: '/_next/static/:path*',
      },
    ]
  },

  // Security headers
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development'

    // In development, disable strict security headers to avoid MIME type issues
    if (isDevelopment) {
      return [
        {
          source: '/((?!_next/static|_next/image|favicon.ico).*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'Referrer-Policy',
              value: 'origin-when-cross-origin',
            },
          ],
        },
      ]
    }

    // Production security headers
    return [
      {
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
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
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co https://api.deepseek.com https://api.geoapify.com wss://*.supabase.co",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].filter(Boolean).join('; '),
          },
        ],
      },
    ]
  },

  // Webpack configuration for better bundling
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle client-side only libraries
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Suppress OpenTelemetry warnings in development
    if (dev) {
      config.ignoreWarnings = [
        { module: /node_modules\/@opentelemetry/ },
        { module: /node_modules\/@sentry/ },
        { module: /node_modules\/require-in-the-middle/ },
        /Critical dependency: the request of a dependency is an expression/,
        /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      ];
    }

    return config
  },

  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },

  // ESLint configuration - disabled for now due to version compatibility
  eslint: {
    ignoreDuringBuilds: true,
  },
}

// Export without Sentry wrapping to fix deployment issues
module.exports = nextConfig
