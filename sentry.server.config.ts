// Only initialize Sentry in production to avoid development warnings
if (process.env.NODE_ENV === 'production') {
  const Sentry = require('@sentry/nextjs')

  Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Server-specific configuration
  beforeSend(event: any, hint: any) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      return null
    }
    
    // Add additional context for server errors
    if (event.exception) {
      event.tags = {
        ...event.tags,
        component: 'server',
      }
    }
    
    return event
  },
  })
}
