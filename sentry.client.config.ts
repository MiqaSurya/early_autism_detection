// Temporarily disable Sentry to fix OpenTelemetry deployment issues
if (false && process.env.NODE_ENV === 'production') {
  const Sentry = {}

  Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay for debugging
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Error filtering
  beforeSend(event: any, hint: any) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      return null
    }
    
    // Filter out known non-critical errors
    const error = hint.originalException
    if (error && typeof error === 'object' && 'message' in error) {
      const message = error.message as string
      
      // Filter out network errors that are expected
      if (message.includes('NetworkError') || message.includes('fetch')) {
        return null
      }
      
      // Filter out authentication errors (handled by app)
      if (message.includes('auth') || message.includes('unauthorized')) {
        return null
      }
    }
    
    return event
  },
  
  // Additional configuration
  integrations: [
    // Replay integration (if available)
    ...(typeof window !== 'undefined' && 'Replay' in Sentry ? [
      new (Sentry as any).Replay({
        maskAllText: true,
        blockAllMedia: true,
      })
    ] : []),
  ],
  })
}
