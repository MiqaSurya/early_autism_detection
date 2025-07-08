import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Early Autism Detector',
    short_name: 'Autism Detector',
    description: 'Early autism detection and support platform with M-CHAT-R assessment, autism center locator, and AI-powered guidance.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'en-US',
    categories: ['health', 'medical', 'education'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    screenshots: [
      {
        src: '/screenshot-wide.png',
        sizes: '1280x720',
        type: 'image/png',


      },
      {
        src: '/screenshot-narrow.png',
        sizes: '750x1334',
        type: 'image/png',


      }
    ],
    shortcuts: [
      {
        name: 'M-CHAT-R Assessment',
        short_name: 'Assessment',
        description: 'Start a new autism screening assessment',
        url: '/dashboard/assessment',
        icons: [
          {
            src: '/icon-assessment.png',
            sizes: '96x96',
            type: 'image/png'
          }
        ]
      },
      {
        name: 'Find Autism Centers',
        short_name: 'Locator',
        description: 'Find nearby autism treatment centers',
        url: '/dashboard/locator',
        icons: [
          {
            src: '/icon-locator.png',
            sizes: '96x96',
            type: 'image/png'
          }
        ]
      },
      {
        name: 'AI Chat Support',
        short_name: 'Chat',
        description: 'Get AI-powered autism support and guidance',
        url: '/dashboard/chat',
        icons: [
          {
            src: '/icon-chat.png',
            sizes: '96x96',
            type: 'image/png'
          }
        ]
      }
    ]
  }
}
