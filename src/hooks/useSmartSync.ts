import { useEffect, useRef, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
  pollInterval = 60000, // Default 60 seconds (1 minute)
  enableWebSocket = true,
  maxRetries = 3
}: UseSmartSyncOptions) {
  const [connectionType, setConnectionType] = useState<'websocket' | 'polling' | 'disabled'>('disabled')
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  
  const supabase = createClientComponentClient()
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
    if (!enableWebSocket || retryCount >= maxRetries) {
      console.log('WebSocket disabled or max retries reached, using polling')
      startPolling()
      return
    }

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
              
              if (retryCount < maxRetries) {
                // Retry WebSocket after delay
                retryTimeoutRef.current = setTimeout(() => {
                  tryWebSocket()
                }, 5000 * (retryCount + 1)) // Exponential backoff
              } else {
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
    const isCloudflare = typeof document !== 'undefined' && 
      document.cookie.includes('__cf_bm')
    
    return isCloudflare || userAgent.includes('HeadlessChrome')
  }, [])

  // Auto-switch to polling if WebSocket is problematic
  useEffect(() => {
    if (isWebSocketProblematic() && enableWebSocket) {
      console.log('Detected WebSocket-problematic environment, using polling')
      forcePolling()
    }
  }, [isWebSocketProblematic, enableWebSocket, forcePolling])

  return {
    connectionType,
    isConnected,
    error,
    retryCount,
    forcePolling,
    forceWebSocket,
    triggerManualUpdate,
    isWebSocketProblematic: isWebSocketProblematic()
  }
}

// Simplified hook that automatically handles WebSocket issues
export function useAutoSync(table: string, onUpdate: (payload: any) => void) {
  return useSmartSync({
    table,
    onUpdate,
    enableWebSocket: true, // Will auto-fallback if problematic
    pollInterval: 30000, // 30 second polling (reasonable interval)
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
