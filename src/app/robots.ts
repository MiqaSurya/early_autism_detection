import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://early-autism-detection.vercel.app'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/auth/login',
          '/auth/register',
          '/privacy',
          '/terms',
        ],
        disallow: [
          '/dashboard/',
          '/admin/',
          '/api/',
          '/auth/callback',
          '/auth/verify',
          '/debug/',
          '/test/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/auth/login',
          '/auth/register',
          '/privacy',
          '/terms',
        ],
        disallow: [
          '/dashboard/',
          '/admin/',
          '/api/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
