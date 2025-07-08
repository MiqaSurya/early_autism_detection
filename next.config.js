/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react'],
  },

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

  // Output configuration
  output: 'standalone',

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

    return [
      {
        source: '/(.*)',
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
            value: isDevelopment ? '' : 'max-age=31536000; includeSubDomains; preload',
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
              isDevelopment ? "upgrade-insecure-requests" : "",
            ].filter(Boolean).join('; '),
          },
        ].filter(header => header.value !== ''),
      },
    ]
  },

  // Content Security Policy
  async rewrites() {
    return []
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

    return config
  },

  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig
