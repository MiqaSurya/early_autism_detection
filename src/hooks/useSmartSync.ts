import { useEffect, useRef, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface UseSmartSyncOptions {
  table: string
  onUpdate?: (payload: any) => void
  onError?: (error: any) => void
  pollInterval?: number // Fallback polling interval in ms
  enableWebSocket?: boolean // Allow disabling WebSocket entirely
  maxRetries?: number
}

export function useSmartSync({
  table,
  onUpdate,
  onError,
  pollInterval = 120000, // Increased to 120 seconds (2 minutes) to reduce load
  enableWebSocket = false, // Disabled to prevent WebSocket errors
  maxRetries = 0 // No retries to prevent WebSocket attempts
}: UseSmartSyncOptions) {
  const [connectionType, setConnectionType] = useState<'websocket' | 'polling' | 'disabled'>('disabled')
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const subscriptionRef = useRef<any>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataHashRef = useRef<string>('')

  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.unsubscribe()
      } catch (e) {
        console.warn('Error unsubscribing:', e)
      }
      subscriptionRef.current = null
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return

    setConnectionType('polling')
    setIsConnected(true)
    setError(null)

    const poll = async () => {
      try {
        // Only trigger update callback for polling (don't call it immediately)
        if (onUpdate) {
          onUpdate({
            eventType: 'POLL',
            source: 'polling',
            timestamp: new Date().toISOString()
          })
        }
      } catch (error) {
        console.warn('Polling error:', error)
        if (onError) {
          onError(error)
        }
      }
    }

    // Don't poll immediately, wait for the first interval
    pollIntervalRef.current = setInterval(poll, pollInterval)
  }, [onUpdate, onError, pollInterval])

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    if (connectionType === 'polling') {
      setConnectionType('disabled')
      setIsConnected(false)
    }
  }, [connectionType])

  const tryWebSocket = useCallback(() => {
    // Force disable WebSocket to prevent Cloudflare cookie errors
    console.debug('WebSocket disabled globally to prevent Cloudflare issues, using polling')
    startPolling()
    return

    // Original WebSocket code disabled:
    // if (!enableWebSocket || retryCount >= maxRetries) {
    //   console.log('WebSocket disabled or max retries reached, using polling')
    //   startPolling()
    //   return
    // }

    cleanup()
    setConnectionType('websocket')
    setError(null)
    
    try {
      const channelName = `smart-sync-${table}-${Date.now()}`
      
      subscriptionRef.current = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: channelName }
          }
        })
        .on('postgres_changes', 
          { event: '*', schema: 'public', table },
          (payload) => {
            setIsConnected(true)
            setError(null)
            setRetryCount(0) // Reset retry count on successful connection
            
            if (onUpdate) {
              onUpdate({
                ...payload,
                source: 'websocket'
              })
            }
          }
        )
        .subscribe((status, err) => {
          console.log(`WebSocket status for ${table}:`, status)
          
          switch (status) {
            case 'SUBSCRIBED':
              setIsConnected(true)
              setError(null)
              setRetryCount(0)
              stopPolling() // Stop polling if WebSocket works
              break
              
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
            case 'CLOSED':
              console.warn(`WebSocket ${status} for ${table}, falling back to polling`)
              setIsConnected(false)
              setError(`WebSocket ${status.toLowerCase()}`)
              
              if (onError) {
                onError(err || new Error(`WebSocket ${status}`))
              }
              
              // Increment retry count and fallback to polling
              setRetryCount(prev => prev + 1)

              if (retryCount >= maxRetries) {
                // Max retries reached, use polling
                startPolling()
              }
              break
              
            default:
              console.log(`WebSocket status: ${status}`)
          }
        })
        
    } catch (error) {
      console.error(`WebSocket setup failed for ${table}:`, error)
      setIsConnected(false)
      setError(error instanceof Error ? error.message : 'WebSocket setup failed')
      
      if (onError) {
        onError(error)
      }
      
      // Fallback to polling immediately
      startPolling()
    }
  }, [table, enableWebSocket, retryCount, maxRetries, onUpdate, onError, supabase, cleanup, startPolling, stopPolling])

  // Handle retry logic
  useEffect(() => {
    if (retryCount > 0 && retryCount < maxRetries && enableWebSocket) {
      const timeoutId = setTimeout(() => {
        tryWebSocket()
      }, 5000 * retryCount) // Exponential backoff

      return () => clearTimeout(timeoutId)
    }
  }, [retryCount, maxRetries, enableWebSocket, tryWebSocket])

  const forcePolling = useCallback(() => {
    cleanup()
    setRetryCount(maxRetries) // Prevent WebSocket retries
    startPolling()
  }, [cleanup, maxRetries, startPolling])

  const forceWebSocket = useCallback(() => {
    setRetryCount(0)
    tryWebSocket()
  }, [tryWebSocket])

  const triggerManualUpdate = useCallback(() => {
    if (onUpdate) {
      onUpdate({
        eventType: 'MANUAL',
        source: 'manual',
        timestamp: new Date().toISOString()
      })
    }
  }, [onUpdate])

  useEffect(() => {
    // Start with WebSocket if enabled, otherwise use polling
    if (enableWebSocket) {
      tryWebSocket()
    } else {
      startPolling()
    }
    
    return cleanup
  }, [enableWebSocket, tryWebSocket, startPolling, cleanup])

  // Detect if we're in an environment where WebSocket might fail
  const isWebSocketProblematic = useCallback(() => {
    // Check for common indicators of WebSocket issues
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''

    // Check for Cloudflare indicators
    const isCloudflare = typeof document !== 'undefined' && (
      document.cookie.includes('__cf_bm') ||
      document.cookie.includes('cf_clearance') ||
      window.location.hostname.includes('.vercel.app') ||
      window.location.hostname.includes('cloudflare')
    )

    // Check for other problematic environments
    const isHeadless = userAgent.includes('HeadlessChrome')
    const isBot = userAgent.includes('bot') || userAgent.includes('crawler')

    if (isCloudflare) {
      console.log('🔍 Cloudflare detected - WebSocket may be blocked, using polling mode')
    }

    return isCloudflare || isHeadless || isBot
  }, [])

  // Store the result to avoid calling during render
  const [isProblematic, setIsProblematic] = useState(false)

  // Check once on mount
  useEffect(() => {
    setIsProblematic(isWebSocketProblematic())
  }, [isWebSocketProblematic])

  // Auto-switch to polling if WebSocket is problematic
  useEffect(() => {
    if (isProblematic && enableWebSocket) {
      console.log('Detected WebSocket-problematic environment, using polling')
      forcePolling()
    }
  }, [isProblematic, enableWebSocket, forcePolling])

  return {
    connectionType,
    isConnected,
    error,
    retryCount,
    forcePolling,
    forceWebSocket,
    triggerManualUpdate,
    isWebSocketProblematic: isProblematic
  }
}

// Simplified hook that automatically handles WebSocket issues
export function useAutoSync(table: string, onUpdate: (payload: any) => void) {
  return useSmartSync({
    table,
    onUpdate,
    enableWebSocket: true, // Will auto-fallback if problematic
    pollInterval: 180000, // Increased to 180 seconds (3 minutes) for auto-sync
    maxRetries: 1, // Quick fallback to polling
    onError: (error) => {
      console.warn(`Auto-sync error for ${table}:`, error)
    }
  })
}

// Hook for environments where WebSocket is known to be problematic
export function usePollingOnlySync(table: string, onUpdate: (payload: any) => void) {
  return useSmartSync({
    table,
    onUpdate,
    enableWebSocket: false, // Polling only
    pollInterval: 45000, // 45 second polling (conservative)
    onError: (error) => {
      console.warn(`Polling sync error for ${table}:`, error)
    }
  })
}
