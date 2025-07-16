/**
 * Centralized configuration for real-time synchronization and polling intervals
 * 
 * This file controls all timing-related settings for the autism center app
 * to prevent performance issues and excessive server load.
 */

export const SYNC_CONFIG = {
  // Real-time WebSocket settings
  REALTIME: {
    // How long to wait before retrying a failed WebSocket connection
    RETRY_DELAY: 5000, // 5 seconds
    
    // Maximum number of retry attempts before falling back to polling
    MAX_RETRIES: 3,
    
    // Heartbeat interval for WebSocket connections
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
  },

  // Polling intervals (fallback when WebSocket fails)
  POLLING: {
    // User-facing autism center locator
    LOCATOR: 60000, // 1 minute
    
    // Admin dashboard center management
    ADMIN: 120000, // 2 minutes
    
    // Center portal (for registered centers)
    CENTER_PORTAL: 90000, // 1.5 minutes
    
    // Questionnaire updates
    QUESTIONNAIRE: 300000, // 5 minutes (less frequent as questions change rarely)
    
    // General fallback polling
    DEFAULT: 120000, // 2 minutes
    
    // Polling-only mode (when WebSocket is completely disabled)
    POLLING_ONLY: 180000, // 3 minutes
  },

  // Debounce settings to prevent excessive API calls
  DEBOUNCE: {
    // User input debouncing (search, filters)
    USER_INPUT: 1500, // 1.5 seconds
    
    // Real-time update debouncing
    REALTIME_UPDATES: 2000, // 2 seconds
    
    // Map interaction debouncing
    MAP_INTERACTION: 1000, // 1 second
    
    // Filter changes debouncing
    FILTER_CHANGES: 1500, // 1.5 seconds
  },

  // Rate limiting settings
  RATE_LIMIT: {
    // Maximum API calls per minute for different operations
    SEARCH_REQUESTS: 30, // 30 searches per minute
    UPDATE_REQUESTS: 20, // 20 updates per minute
    LOCATION_REQUESTS: 60, // 60 location requests per minute
  },

  // Performance optimization settings
  PERFORMANCE: {
    // Batch size for bulk operations
    BATCH_SIZE: 10,
    
    // Cache duration for API responses
    CACHE_DURATION: 300000, // 5 minutes
    
    // Maximum number of concurrent requests
    MAX_CONCURRENT_REQUESTS: 3,
    
    // Timeout for API requests
    REQUEST_TIMEOUT: 10000, // 10 seconds
  },

  // WebSocket control settings
  WEBSOCKET: {
    // Global WebSocket enable/disable flag
    ENABLED: false, // Disabled to prevent Cloudflare issues

    // Force polling mode (disables all WebSocket connections)
    FORCE_POLLING_MODE: true, // Force polling mode for stability

    // Connection timeout before falling back to polling
    CONNECTION_TIMEOUT: 10000, // 10 seconds

    // Maximum retry attempts before giving up on WebSocket
    MAX_RETRIES: 0, // No retries to prevent errors
  },

  // Environment-specific overrides
  ENVIRONMENT_OVERRIDES: {
    development: {
      // Faster polling in development for testing
      POLLING: {
        LOCATOR: 30000, // 30 seconds
        ADMIN: 60000, // 1 minute
      },
      DEBOUNCE: {
        USER_INPUT: 500, // 0.5 seconds
        REALTIME_UPDATES: 1000, // 1 second
      }
    },
    production: {
      // Conservative settings for production
      POLLING: {
        LOCATOR: 120000, // 2 minutes
        ADMIN: 180000, // 3 minutes
      },
      DEBOUNCE: {
        USER_INPUT: 2000, // 2 seconds
        REALTIME_UPDATES: 3000, // 3 seconds
      }
    }
  }
} as const

/**
 * Get configuration values based on current environment
 */
export function getSyncConfig() {
  const env = process.env.NODE_ENV || 'development'
  const baseConfig = SYNC_CONFIG
  const envOverrides = SYNC_CONFIG.ENVIRONMENT_OVERRIDES[env as keyof typeof SYNC_CONFIG.ENVIRONMENT_OVERRIDES]
  
  if (!envOverrides) {
    return baseConfig
  }
  
  // Merge environment-specific overrides
  return {
    ...baseConfig,
    POLLING: {
      ...baseConfig.POLLING,
      ...envOverrides.POLLING
    },
    DEBOUNCE: {
      ...baseConfig.DEBOUNCE,
      ...envOverrides.DEBOUNCE
    }
  }
}

/**
 * Helper functions to get specific timing values
 */
export const getPollingInterval = (type: keyof typeof SYNC_CONFIG.POLLING) => {
  return getSyncConfig().POLLING[type]
}

export const getDebounceDelay = (type: keyof typeof SYNC_CONFIG.DEBOUNCE) => {
  return getSyncConfig().DEBOUNCE[type]
}

export const getRateLimit = (type: keyof typeof SYNC_CONFIG.RATE_LIMIT) => {
  return SYNC_CONFIG.RATE_LIMIT[type]
}

// Detect Cloudflare or other WebSocket-problematic environments
const detectCloudflareOrProblematicEnv = () => {
  if (typeof window === 'undefined') return false

  // Check for Cloudflare indicators
  const isCloudflare = (
    document.cookie.includes('__cf_bm') ||
    document.cookie.includes('cf_clearance') ||
    window.location.hostname.includes('.vercel.app') ||
    window.location.hostname.includes('cloudflare') ||
    window.location.hostname.includes('netlify.app')
  )

  return isCloudflare
}

export const isWebSocketEnabled = () => {
  const config = getSyncConfig()
  const isCloudflareDetected = detectCloudflareOrProblematicEnv()

  // Automatically disable WebSocket if Cloudflare is detected
  if (isCloudflareDetected) {
    console.log('🔍 Cloudflare/CDN detected - automatically disabling WebSocket, using polling mode')
    return false
  }

  return config.WEBSOCKET.ENABLED && !config.WEBSOCKET.FORCE_POLLING_MODE
}

export const shouldForcePolling = () => {
  const config = getSyncConfig()
  const isCloudflareDetected = detectCloudflareOrProblematicEnv()

  // Force polling if Cloudflare is detected or explicitly configured
  return config.WEBSOCKET.FORCE_POLLING_MODE || isCloudflareDetected
}

/**
 * Logging helper for sync operations
 */
export function logSyncOperation(operation: string, details?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[SYNC ${timestamp}] ${operation}`, details || '')
}

/**
 * Performance monitoring helper
 */
export function measureSyncPerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  
  return fn().then(result => {
    const duration = performance.now() - start
    logSyncOperation(`${operation} completed in ${duration.toFixed(2)}ms`)
    return result
  }).catch(error => {
    const duration = performance.now() - start
    logSyncOperation(`${operation} failed after ${duration.toFixed(2)}ms`, error)
    throw error
  })
}
