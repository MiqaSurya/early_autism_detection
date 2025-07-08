'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { initializeAnalytics, gtag } from '@/lib/analytics'

interface AnalyticsProviderProps {
  children: React.ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname()

  useEffect(() => {
    // Initialize analytics on mount
    initializeAnalytics()
  }, [])

  useEffect(() => {
    // Track page views on route changes
    if (pathname) {
      gtag.pageView(window.location.href, document.title)
    }
  }, [pathname])

  return <>{children}</>
}
