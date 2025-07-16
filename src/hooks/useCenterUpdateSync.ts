import { useEffect, useRef, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface CenterUpdateSyncOptions {
  onCenterUpdate?: (payload: any) => void
  onError?: (error: any) => void
  enableRealtime?: boolean
  pollingInterval?: number
  maxRetries?: number
}

interface SyncStatus {
  isConnected: boolean
  connectionType: 'websocket' | 'polling' | 'disabled'
  lastUpdate: Date | null
  error: string | null
  retryCount: number
  isPolling: boolean
}

export function useCenterUpdateSync({
  onCenterUpdate,
  onError,
  enableRealtime = false, // Disabled by default to prevent WebSocket errors
  pollingInterval = 60000, // Increased to 60 seconds to reduce server load
  maxRetries = 0 // No retries to prevent WebSocket attempts
}: CenterUpdateSyncOptions = {}) {
  const [status, setStatus] = useState<SyncStatus>({
    isConnected: false,
    connectionType: 'disabled',
    lastUpdate: null,
    error: null,
    retryCount: 0,
    isPolling: false
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const subscriptionRef = useRef<any>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataHashRef = useRef<string>('')

  // Use refs to store stable references and prevent infinite loops
  const onCenterUpdateRef = useRef(onCenterUpdate)
  const onErrorRef = useRef(onError)

  // Update refs when props change
  useEffect(() => {
    onCenterUpdateRef.current = onCenterUpdate
    onErrorRef.current = onError
  }, [onCenterUpdate, onError])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.unsubscribe()
      } catch (e) {
        console.warn('Error unsubscribing from center updates:', e)
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

  // Enhanced polling with change detection
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return

    // Reduced logging for cleaner console
    
    setStatus(prev => ({
      ...prev,
      connectionType: 'polling',
      isConnected: true,
      isPolling: true,
      error: null
    }))

    const poll = async () => {
      try {
        // Get latest center data with updated_at for change detection
        const { data, error: fetchError } = await supabase
          .from('autism_centers')
          .select('id, name, updated_at, type, address, latitude, longitude, phone, email, description, verified, is_verified')
          .order('updated_at', { ascending: false })

        if (fetchError) {
          console.error('Center polling error:', fetchError)
          setStatus(prev => ({
            ...prev,
            error: `Polling failed: ${fetchError.message}`,
            isConnected: false
          }))
          if (onErrorRef.current) onErrorRef.current(fetchError)
          return
        }

        if (data) {
          // Create hash of current data to detect changes
          const dataHash = JSON.stringify(data.map(center => ({
            id: center.id,
            updated_at: center.updated_at,
            name: center.name
          })))

          // Only trigger update if data actually changed
          if (dataHash !== lastDataHashRef.current) {
            // Data changed, triggering update
            lastDataHashRef.current = dataHash
            
            setStatus(prev => ({
              ...prev,
              lastUpdate: new Date(),
              isConnected: true,
              error: null
            }))

            if (onCenterUpdateRef.current) {
              onCenterUpdateRef.current({
                eventType: 'POLL_UPDATE',
                source: 'polling',
                timestamp: new Date().toISOString(),
                data: data,
                changeCount: data.length
              })
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
        setStatus(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Polling failed',
          isConnected: false
        }))
        if (onErrorRef.current) onErrorRef.current(error)
      }
    }

    // Initial poll
    poll()
    
    // Set up interval
    pollIntervalRef.current = setInterval(poll, pollingInterval)
  }, [pollingInterval]) // Removed unstable dependencies, using refs instead

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setStatus(prev => ({
      ...prev,
      isPolling: false,
      connectionType: prev.connectionType === 'polling' ? 'disabled' : prev.connectionType
    }))
  }, [])

  // WebSocket real-time sync (DISABLED to prevent Cloudflare issues)
  const startRealtime = useCallback(() => {
    // Force disable WebSocket to prevent Cloudflare cookie errors
    console.debug('WebSocket disabled globally to prevent Cloudflare issues, using polling only')
    startPolling()
    return

    // Original WebSocket code disabled:
    // if (!enableRealtime || status.retryCount >= maxRetries) {
    //   console.log('WebSocket disabled or max retries reached, using polling only')
    //   startPolling()
    //   return
    // }

    cleanup()
    console.log('Starting WebSocket real-time sync for center updates')
    
    setStatus(prev => ({
      ...prev,
      connectionType: 'websocket',
      error: null
    }))

    try {
      const channelName = `center-updates-${Date.now()}`
      
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
            console.log('Real-time center update received:', payload)
            
            setStatus(prev => ({
              ...prev,
              isConnected: true,
              lastUpdate: new Date(),
              error: null,
              retryCount: 0
            }))

            if (onCenterUpdateRef.current) {
              onCenterUpdateRef.current({
                ...payload,
                source: 'websocket',
                timestamp: new Date().toISOString()
              })
            }
          }
        )
        .subscribe((status, err) => {
          console.log(`WebSocket status for center updates:`, status)
          
          switch (status) {
            case 'SUBSCRIBED':
              setStatus(prev => ({
                ...prev,
                isConnected: true,
                error: null,
                retryCount: 0
              }))
              stopPolling() // Stop polling when WebSocket works
              break
              
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
            case 'CLOSED':
              console.warn(`WebSocket ${status}, falling back to polling`)
              setStatus(prev => ({
                ...prev,
                isConnected: false,
                error: `WebSocket ${status.toLowerCase()}`,
                retryCount: prev.retryCount + 1
              }))
              
              if (onError) onError(err || new Error(`WebSocket ${status}`))
              
              // Fallback to polling
              startPolling()
              break
          }
        })
        
    } catch (error) {
      console.error('WebSocket setup failed:', error)
      setStatus(prev => ({
        ...prev,
        isConnected: false,
        error: error instanceof Error ? error.message : 'WebSocket setup failed'
      }))
      
      if (onErrorRef.current) onErrorRef.current(error)
      startPolling() // Immediate fallback
    }
  }, [enableRealtime, status.retryCount, maxRetries, cleanup, startPolling, stopPolling]) // Removed unstable dependencies

  // Force manual refresh
  const forceRefresh = useCallback(() => {
    console.log('Force refreshing center data')
    if (onCenterUpdateRef.current) {
      onCenterUpdateRef.current({
        eventType: 'MANUAL_REFRESH',
        source: 'manual',
        timestamp: new Date().toISOString()
      })
    }
  }, []) // No dependencies needed since we use ref

  // Initialize sync with stable references to prevent infinite loops
  useEffect(() => {
    let mounted = true

    const initializeSync = () => {
      if (!mounted) return

      if (enableRealtime) {
        // Call startRealtime logic directly to avoid function dependency
        if (!enableRealtime || status.retryCount >= maxRetries) {
          console.log('WebSocket disabled or max retries reached, using polling only')
          // Call startPolling logic directly
          if (pollIntervalRef.current) return

          setStatus(prev => ({
            ...prev,
            connectionType: 'polling',
            isConnected: true,
            isPolling: true,
            error: null
          }))

          const poll = async () => {
            if (!mounted) return
            try {
              const { data, error: fetchError } = await supabase
                .from('autism_centers')
                .select('id, name, updated_at, type, address, latitude, longitude, phone, email, description, verified, is_verified')
                .order('updated_at', { ascending: false })

              if (fetchError) {
                console.error('Center polling error:', fetchError)
                if (mounted) {
                  setStatus(prev => ({
                    ...prev,
                    error: `Polling failed: ${fetchError.message}`,
                    isConnected: false
                  }))
                  if (onErrorRef.current) onErrorRef.current(fetchError)
                }
                return
              }

              if (data && mounted) {
                const dataHash = JSON.stringify(data.map(center => ({
                  id: center.id,
                  updated_at: center.updated_at,
                  name: center.name
                })))

                if (dataHash !== lastDataHashRef.current) {
                  lastDataHashRef.current = dataHash

                  setStatus(prev => ({
                    ...prev,
                    lastUpdate: new Date(),
                    isConnected: true,
                    error: null
                  }))

                  if (onCenterUpdateRef.current) {
                    onCenterUpdateRef.current({
                      eventType: 'POLLING_UPDATE',
                      data,
                      source: 'polling',
                      timestamp: new Date().toISOString()
                    })
                  }
                }
              }
            } catch (error) {
              console.error('Polling error:', error)
              if (mounted) {
                setStatus(prev => ({
                  ...prev,
                  error: error instanceof Error ? error.message : 'Polling failed',
                  isConnected: false
                }))
                if (onErrorRef.current) onErrorRef.current(error)
              }
            }
          }

          poll()
          pollIntervalRef.current = setInterval(poll, pollingInterval)
          return
        }

        // WebSocket logic here would be too complex for this approach
        // Let's just use polling for now to fix the infinite loop
        if (pollIntervalRef.current) return

        setStatus(prev => ({
          ...prev,
          connectionType: 'polling',
          isConnected: true,
          isPolling: true,
          error: null
        }))

        const poll = async () => {
          if (!mounted) return
          try {
            const { data, error: fetchError } = await supabase
              .from('autism_centers')
              .select('id, name, updated_at, type, address, latitude, longitude, phone, email, description, verified, is_verified')
              .order('updated_at', { ascending: false })

            if (fetchError) {
              console.error('Center polling error:', fetchError)
              if (mounted) {
                setStatus(prev => ({
                  ...prev,
                  error: `Polling failed: ${fetchError.message}`,
                  isConnected: false
                }))
                if (onErrorRef.current) onErrorRef.current(fetchError)
              }
              return
            }

            if (data && mounted) {
              const dataHash = JSON.stringify(data.map(center => ({
                id: center.id,
                updated_at: center.updated_at,
                name: center.name
              })))

              if (dataHash !== lastDataHashRef.current) {
                lastDataHashRef.current = dataHash

                setStatus(prev => ({
                  ...prev,
                  lastUpdate: new Date(),
                  isConnected: true,
                  error: null
                }))

                if (onCenterUpdateRef.current) {
                  onCenterUpdateRef.current({
                    eventType: 'POLLING_UPDATE',
                    data,
                    source: 'polling',
                    timestamp: new Date().toISOString()
                  })
                }
              }
            }
          } catch (error) {
            console.error('Polling error:', error)
            if (mounted) {
              setStatus(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Polling failed',
                isConnected: false
              }))
              if (onErrorRef.current) onErrorRef.current(error)
            }
          }
        }

        poll()
        pollIntervalRef.current = setInterval(poll, pollingInterval)
      } else {
        // Polling mode
        if (pollIntervalRef.current) return

        setStatus(prev => ({
          ...prev,
          connectionType: 'polling',
          isConnected: true,
          isPolling: true,
          error: null
        }))

        const poll = async () => {
          if (!mounted) return
          try {
            const { data, error: fetchError } = await supabase
              .from('autism_centers')
              .select('id, name, updated_at, type, address, latitude, longitude, phone, email, description, verified, is_verified')
              .order('updated_at', { ascending: false })

            if (fetchError) {
              console.error('Center polling error:', fetchError)
              if (mounted) {
                setStatus(prev => ({
                  ...prev,
                  error: `Polling failed: ${fetchError.message}`,
                  isConnected: false
                }))
                if (onErrorRef.current) onErrorRef.current(fetchError)
              }
              return
            }

            if (data && mounted) {
              const dataHash = JSON.stringify(data.map(center => ({
                id: center.id,
                updated_at: center.updated_at,
                name: center.name
              })))

              if (dataHash !== lastDataHashRef.current) {
                lastDataHashRef.current = dataHash

                setStatus(prev => ({
                  ...prev,
                  lastUpdate: new Date(),
                  isConnected: true,
                  error: null
                }))

                if (onCenterUpdateRef.current) {
                  onCenterUpdateRef.current({
                    eventType: 'POLLING_UPDATE',
                    data,
                    source: 'polling',
                    timestamp: new Date().toISOString()
                  })
                }
              }
            }
          } catch (error) {
            console.error('Polling error:', error)
            if (mounted) {
              setStatus(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Polling failed',
                isConnected: false
              }))
              if (onErrorRef.current) onErrorRef.current(error)
            }
          }
        }

        poll()
        pollIntervalRef.current = setInterval(poll, pollingInterval)
      }
    }

    initializeSync()

    return () => {
      mounted = false
      cleanup()
    }
  }, [enableRealtime, pollingInterval, maxRetries]) // Minimal stable dependencies

  return {
    ...status,
    forceRefresh,
    startPolling,
    stopPolling,
    startRealtime
  }
}
