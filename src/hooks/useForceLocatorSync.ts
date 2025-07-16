import { useEffect, useRef, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface ForceLocatorSyncOptions {
  onForceRefresh: () => void
  onError?: (error: any) => void
  enabled?: boolean
}

export function useForceLocatorSync({
  onForceRefresh,
  onError,
  enabled = false // Disabled by default to prevent console spam
}: ForceLocatorSyncOptions) {
  const subscriptionRef = useRef<any>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<string>('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Enhanced cleanup function with proper WebSocket state management
  const cleanup = useCallback(() => {
    // Clear polling first
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    // Handle WebSocket cleanup more carefully
    if (subscriptionRef.current) {
      try {
        const subscription = subscriptionRef.current
        subscriptionRef.current = null // Clear reference first to prevent re-entry

        // Check if the subscription is still active before unsubscribing
        if (subscription && typeof subscription.unsubscribe === 'function') {
          // Use a timeout to prevent hanging on unsubscribe
          const unsubscribeTimeout = setTimeout(() => {
            console.warn('⚠️ WebSocket unsubscribe timeout, forcing cleanup')
          }, 2000)

          subscription.unsubscribe()
          clearTimeout(unsubscribeTimeout)
        }
      } catch (error) {
        // Silently handle cleanup errors to prevent console spam
        console.debug('WebSocket cleanup completed with minor issues:', error)
      }
    }
  }, [])

  // Optimized polling for updates (reduced frequency and logging)
  const startOptimizedPolling = useCallback(() => {
    if (pollIntervalRef.current) return

    console.debug('🔄 Starting optimized polling (30s interval)')

    const poll = async () => {
      try {
        // Get the latest update timestamp from autism_centers
        const { data, error: fetchError } = await supabase
          .from('autism_centers')
          .select('updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)

        if (fetchError) {
          // Only log errors, not every poll
          if (onError) onError(fetchError)
          return
        }

        if (data && data.length > 0) {
          const latestUpdate = data[0].updated_at

          // Check if there's a new update
          if (latestUpdate !== lastUpdateRef.current && lastUpdateRef.current !== '') {
            console.debug('🔥 Update detected, refreshing locator')

            lastUpdateRef.current = latestUpdate

            // Force immediate refresh
            onForceRefresh()
          } else if (lastUpdateRef.current === '') {
            // Set initial baseline without triggering refresh
            lastUpdateRef.current = latestUpdate
          }
        }
      } catch (error) {
        if (onError) onError(error)
      }
    }

    // Initial poll to set baseline
    poll()

    // Set up polling every 5 minutes (very conservative to reduce console noise)
    pollIntervalRef.current = setInterval(poll, 300000)
  }, [onForceRefresh, onError, supabase])

  // WebSocket real-time sync for instant updates (DISABLED)
  const startRealtimeSync = useCallback(() => {
    // Force disable WebSocket to prevent Cloudflare cookie errors
    console.debug('WebSocket disabled globally to prevent Cloudflare issues, using polling')
    startOptimizedPolling()
    return

    // Original WebSocket code disabled:
    // cleanup()
    // console.debug('🔗 Starting WebSocket real-time sync')

    try {
      const channelName = `locator-sync-${Date.now()}`

      subscriptionRef.current = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: false },
            presence: { key: channelName }
          }
        })
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'autism_centers' },
          (payload) => {
            console.debug('🔥 Real-time update: Center data changed')

            // Force immediate refresh regardless of the change type
            onForceRefresh()
          }
        )
        .subscribe((status, err) => {
          switch (status) {
            case 'SUBSCRIBED':
              console.log('✅ WebSocket connected')
              // Stop polling when WebSocket works
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
              }
              break

            case 'CHANNEL_ERROR':
              console.warn('⚠️ WebSocket channel error, switching to polling')
              if (onError) onError(err || new Error('WebSocket channel error'))
              startOptimizedPolling()
              break

            case 'TIMED_OUT':
              console.warn('⚠️ WebSocket timed out, switching to polling')
              if (onError) onError(err || new Error('WebSocket timeout'))
              startOptimizedPolling()
              break

            case 'CLOSED':
              // Don't treat CLOSED as an error during normal cleanup
              console.debug('🔌 WebSocket connection closed')
              // Only switch to polling if this wasn't an intentional cleanup
              if (subscriptionRef.current) {
                console.warn('⚠️ Unexpected WebSocket closure, switching to polling')
                startOptimizedPolling()
              }
              break
          }
        })

    } catch (error) {
      console.error('❌ WebSocket setup failed:', error)
      if (onError) onError?.(error)

      // Immediate fallback to optimized polling
      startOptimizedPolling()
    }
  }, [onForceRefresh, onError, supabase, cleanup, startOptimizedPolling])

  // Initialize sync
  useEffect(() => {
    if (!enabled) return

    console.debug('🔄 Initializing locator sync')

    // Start with WebSocket, fallback to optimized polling
    startRealtimeSync()

    return cleanup
  }, [enabled, startRealtimeSync, cleanup])

  return {
    cleanup,
    startRealtimeSync,
    startOptimizedPolling
  }
}
