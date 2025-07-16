/**
 * Analytics and Tracking Utilities
 * Handles user analytics, performance monitoring, and event tracking
 */

import { logger } from './logger'

// Analytics configuration
const ANALYTICS_CONFIG = {
  // Google Analytics
  gaId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  
  // Vercel Analytics
  vercelAnalytics: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === 'true',
  
  // Custom events
  enableCustomEvents: true,
  
  // Privacy settings
  respectDoNotTrack: true,
  anonymizeIp: true,
}

// Check if analytics should be enabled
function shouldTrack(): boolean {
  // Respect Do Not Track header
  if (ANALYTICS_CONFIG.respectDoNotTrack && typeof navigator !== 'undefined') {
    if (navigator.doNotTrack === '1' || (navigator as any).msDoNotTrack === '1') {
      return false
    }
  }
  
  // Only track in production
  return process.env.NODE_ENV === 'production'
}

// Google Analytics functions
export const gtag = {
  // Initialize Google Analytics
  init: () => {
    if (!ANALYTICS_CONFIG.gaId || !shouldTrack()) return
    
    // Load gtag script
    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.gaId}`
    script.async = true
    document.head.appendChild(script)
    
    // Initialize gtag
    ;(window as any).dataLayer = (window as any).dataLayer || []
    ;(window as any).gtag = function() {
      ;(window as any).dataLayer.push(arguments)
    }
    
    ;(window as any).gtag('js', new Date())
    ;(window as any).gtag('config', ANALYTICS_CONFIG.gaId, {
      anonymize_ip: ANALYTICS_CONFIG.anonymizeIp,
      send_page_view: false, // We'll handle page views manually
    })
  },
  
  // Track page views
  pageView: (url: string, title?: string) => {
    if (!ANALYTICS_CONFIG.gaId || !shouldTrack()) return
    
    ;(window as any).gtag?.('config', ANALYTICS_CONFIG.gaId, {
      page_location: url,
      page_title: title,
    })
  },
  
  // Track custom events
  event: (action: string, parameters?: Record<string, any>) => {
    if (!ANALYTICS_CONFIG.gaId || !shouldTrack()) return
    
    ;(window as any).gtag?.('event', action, parameters)
  },
}

// Custom event tracking
export const trackEvent = {
  // User authentication events
  userRegistered: (method: string = 'email') => {
    gtag.event('sign_up', {
      method,
      event_category: 'authentication',
    })
    
    logger.info('User registered', {
      component: 'analytics',
      metadata: { method }
    })
  },
  
  userLoggedIn: (method: string = 'email') => {
    gtag.event('login', {
      method,
      event_category: 'authentication',
    })
  },
  
  // Assessment events
  assessmentStarted: (assessmentType: string = 'M-CHAT-R') => {
    gtag.event('assessment_started', {
      assessment_type: assessmentType,
      event_category: 'assessment',
    })
  },
  
  assessmentCompleted: (assessmentType: string, score: number, riskLevel: string) => {
    gtag.event('assessment_completed', {
      assessment_type: assessmentType,
      score,
      risk_level: riskLevel,
      event_category: 'assessment',
    })
  },
  
  // Feature usage events
  featureUsed: (feature: string, action?: string) => {
    gtag.event('feature_used', {
      feature_name: feature,
      action,
      event_category: 'engagement',
    })
  },
  
  // Location events
  centerSearched: (searchType: string, resultsCount: number) => {
    gtag.event('center_searched', {
      search_type: searchType,
      results_count: resultsCount,
      event_category: 'location',
    })
  },
  
  centerViewed: (centerId: string, centerType: string) => {
    gtag.event('center_viewed', {
      center_id: centerId,
      center_type: centerType,
      event_category: 'location',
    })
  },
  
  // AI Chat events
  chatStarted: () => {
    gtag.event('chat_started', {
      event_category: 'ai_chat',
    })
  },
  
  chatMessageSent: (messageLength: number) => {
    gtag.event('chat_message_sent', {
      message_length: messageLength,
      event_category: 'ai_chat',
    })
  },
  
  // Error tracking
  errorOccurred: (errorType: string, errorMessage: string, component?: string) => {
    gtag.event('exception', {
      description: errorMessage,
      fatal: false,
      error_type: errorType,
      component,
    })
  },
  
  // Performance tracking
  performanceMetric: (metricName: string, value: number, unit: string = 'ms') => {
    gtag.event('timing_complete', {
      name: metricName,
      value: Math.round(value),
      event_category: 'performance',
      unit,
    })
  },
}

// Performance monitoring
export const performance = {
  // Measure page load time with fallback for unsupported environments
  measurePageLoad: () => {
    if (typeof window === 'undefined') return

    window.addEventListener('load', () => {
      try {
        // Check if performance.getEntriesByType is available
        if (typeof window !== 'undefined' &&
            typeof window.performance !== 'undefined' &&
            typeof window.performance.getEntriesByType === 'function') {

          const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          if (navigation) {
            trackEvent.performanceMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart)
            trackEvent.performanceMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart)
          }
        } else {
          // Fallback for environments without getEntriesByType
          console.debug('Performance API not fully supported, skipping detailed metrics')

          // Simple fallback using performance.now() if available
          if (typeof window !== 'undefined' &&
              typeof window.performance !== 'undefined' &&
              typeof window.performance.now === 'function') {
            const loadTime = window.performance.now()
            trackEvent.performanceMetric('page_load_time_fallback', loadTime)
          }
        }
      } catch (error) {
        console.debug('Performance measurement failed:', error)
        // Silently fail - analytics shouldn't break the app
      }
    })
  },
  
  // Measure Core Web Vitals
  measureWebVitals: () => {
    if (typeof window === 'undefined') return
    
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      trackEvent.performanceMetric('largest_contentful_paint', lastEntry.startTime)
    }).observe({ entryTypes: ['largest-contentful-paint'] })
    
    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        trackEvent.performanceMetric('first_input_delay', entry.processingStart - entry.startTime)
      })
    }).observe({ entryTypes: ['first-input'] })
    
    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
      trackEvent.performanceMetric('cumulative_layout_shift', clsValue * 1000, 'score')
    }).observe({ entryTypes: ['layout-shift'] })
  },
}

// Initialize analytics
export const initializeAnalytics = () => {
  if (typeof window === 'undefined') return
  
  // Initialize Google Analytics
  gtag.init()
  
  // Set up performance monitoring
  performance.measurePageLoad()
  performance.measureWebVitals()
  
  logger.info('Analytics initialized', {
    component: 'analytics',
    metadata: {
      gaEnabled: !!ANALYTICS_CONFIG.gaId,
      vercelEnabled: ANALYTICS_CONFIG.vercelAnalytics,
      trackingEnabled: shouldTrack()
    }
  })
}

// Export configuration for external use
export const analyticsConfig = ANALYTICS_CONFIG
