import { useEffect, useRef, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface UseRealtimeSyncOptions {
  table: string
  onUpdate?: (payload: any) => void
  onError?: (error: any) => void
  pollInterval?: number // Fallback polling interval in ms
  retryDelay?: number // Retry delay in ms
}

export function useRealtimeSync({
  table,
  onUpdate,
  onError,
  pollInterval = 300000, // Increased to 5 minutes to reduce load
  retryDelay = 5000
}: UseRealtimeSyncOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting')
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const subscriptionRef = useRef<any>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
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
  }

  const startPolling = () => {
    if (pollIntervalRef.current) return
    
    setConnectionStatus('polling')
    setIsConnected(false)
    
    pollIntervalRef.current = setInterval(() => {
      if (onUpdate) {
        onUpdate({ eventType: 'POLL', source: 'polling' })
      }
    }, pollInterval)
  }

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  const setupSubscription = () => {
    // Force disable WebSocket to prevent Cloudflare cookie errors
    console.debug('WebSocket disabled globally to prevent Cloudflare issues, using polling')
    startPolling()
    return

    // Original WebSocket code disabled:
    // cleanup()
    // try {
    //   setConnectionStatus('connecting')
    //   setError(null)
    //   const channelName = `realtime-${table}-${Date.now()}`
    //
    //   subscriptionRef.current = supabase
    //     .channel(channelName, {
    //       config: {
    //         broadcast: { self: true },
    //         presence: { key: channelName }
    //       }
    //     })
    //     .on('postgres_changes',
    //       { event: '*', schema: 'public', table },
    //       (payload) => {
    //         setIsConnected(true)
    //         setConnectionStatus('connected')
    //         setError(null)
    //
    //         if (onUpdate) {
    //           onUpdate(payload)
    //         }
    //       }
    //     )
    //     .subscribe((status, err) => {
    //       console.log(`Subscription status for ${table}:`, status, err)
    //
    //       switch (status) {
    //         case 'SUBSCRIBED':
    //           setIsConnected(true)
    //           setConnectionStatus('connected')
    //           setError(null)
    //           stopPolling()
    //           break
    //
    //         case 'CHANNEL_ERROR':
    //         case 'TIMED_OUT':
    //         case 'CLOSED':
    //           setIsConnected(false)
    //           setConnectionStatus('error')
    //           setError(`Connection ${status.toLowerCase()}`)
    //
    //           if (onError) {
    //             onError(err || new Error(`Subscription ${status}`))
    //           }
    //
    //           // Start polling as fallback
    //           startPolling()
    //
    //           // Retry subscription after delay
    //           retryTimeoutRef.current = setTimeout(() => {
    //             console.log(`Retrying subscription for ${table}...`)
    //             setupSubscription()
    //           }, retryDelay)
    //           break
    //
    //         default:
    //           setConnectionStatus(status.toLowerCase())
    //       }
    //     })
    //
    // } catch (error) {
    //   console.error(`Failed to setup subscription for ${table}:`, error)
    //   setIsConnected(false)
    //   setConnectionStatus('error')
    //   setError(error instanceof Error ? error.message : 'Unknown error')
    //
    //   if (onError) {
    //     onError(error)
    //   }
    //
    //   // Fallback to polling
    //   startPolling()
    // }
  }

  useEffect(() => {
    setupSubscription()
    
    return cleanup
  }, [table])

  const retry = () => {
    setupSubscription()
  }

  const forcePolling = () => {
    cleanup()
    startPolling()
  }

  return {
    isConnected,
    connectionStatus,
    error,
    retry,
    forcePolling
  }
}

// Simplified hook for basic real-time sync
export function useSimpleRealtimeSync(
  table: string, 
  onUpdate: (payload: any) => void
) {
  return useRealtimeSync({
    table,
    onUpdate,
    onError: (error) => {
      console.warn(`Real-time sync error for ${table}:`, error)
    }
  })
}
