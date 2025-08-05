import './globals.css'
import 'leaflet/dist/leaflet.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary'
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: {
    template: '%s | Early Autism Detector',
    default: 'Early Autism Detector - Autism Screening and Support Platform',
  },
  description: 'Early detection and support for autism spectrum disorder with M-CHAT-R assessment, autism center locator, and AI-powered guidance.',
  applicationName: 'Early Autism Detector',
  authors: [{ name: 'Early Autism Detector Team' }],
  generator: 'Next.js',
  keywords: [
    'autism', 'autism detection', 'early autism detection', 'M-CHAT-R',
    'autism assessment', 'autism screening', 'autism center locator',
    'autism support', 'child development', 'developmental milestones'
  ],
  referrer: 'origin-when-cross-origin',
  creator: 'Early Autism Detector Team',
  publisher: 'Early Autism Detector',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://autismearlydetectioncompanion.vercel.app'
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Early Autism Detector - Autism Screening and Support Platform',
    description: 'Early detection and support for autism spectrum disorder with M-CHAT-R assessment, autism center locator, and AI-powered guidance.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://autismearlydetectioncompanion.vercel.app',
    siteName: 'Early Autism Detector',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Early Autism Detector - Autism Screening and Support Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Early Autism Detector - Autism Screening and Support Platform',
    description: 'Early detection and support for autism spectrum disorder with M-CHAT-R assessment, autism center locator, and AI-powered guidance.',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    title: 'Early Autism Detector',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900`}>
        <GlobalErrorBoundary>
          <AnalyticsProvider>
            {children}
            <Toaster />
          </AnalyticsProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  )
}
