'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { AutismCenter } from '@/types/location'

interface UseRealtimeCentersOptions {
  onCenterAdded?: (center: AutismCenter) => void
  onCenterUpdated?: (center: AutismCenter) => void
  onCenterDeleted?: (centerId: string) => void
  enabled?: boolean
}

export function useRealtimeCenters({
  onCenterAdded,
  onCenterUpdated,
  onCenterDeleted,
  enabled = false // Disabled by default to prevent console spam
}: UseRealtimeCentersOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const subscriptionRef = useRef<any>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = useCallback(() => {
    // Clear retry timeout first
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }

    // Handle WebSocket cleanup more carefully
    if (subscriptionRef.current) {
      try {
        console.debug('🔌 Cleaning up real-time sync for autism centers')
        const subscription = subscriptionRef.current
        subscriptionRef.current = null // Clear reference first to prevent re-entry

        // Check if the subscription is still active before unsubscribing
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe()
        }
      } catch (error) {
        // Silently handle cleanup errors to prevent console spam
        console.debug('WebSocket cleanup completed with minor issues:', error)
      }
    }
  }, [])

  const setupSubscription = useCallback(() => {
    // Force disable WebSocket to prevent Cloudflare cookie errors
    console.debug('WebSocket disabled globally to prevent Cloudflare issues')
    return

    // Original WebSocket code disabled:
    // if (!enabled) return
    // cleanup() // Clean up any existing subscription
    // console.debug(`🔄 Setting up real-time sync for autism centers (attempt ${retryCount + 1})...`)

    try {
      // Create a unique channel name to avoid conflicts
      const channelName = `autism_centers_realtime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Subscribe to autism_centers table changes with more robust configuration
      const subscription = supabase
        .channel(channelName, {
          config: {
            presence: {
              key: 'autism_centers_locator'
            },
            broadcast: {
              self: false
            }
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'autism_centers'
          },
          (payload) => {
            console.debug('✅ New center added via real-time:', payload.new)
            setLastUpdate(new Date())
            setIsConnected(true)
            setError(null)
            setRetryCount(0) // Reset retry count on successful event

            if (onCenterAdded && payload.new) {
              onCenterAdded(payload.new as AutismCenter)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'autism_centers'
          },
          (payload) => {
            console.debug('🔄 Center updated via real-time:', payload.new)
            setLastUpdate(new Date())
            setIsConnected(true)
            setError(null)
            setRetryCount(0) // Reset retry count on successful event

            if (onCenterUpdated && payload.new) {
              onCenterUpdated(payload.new as AutismCenter)
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'autism_centers'
          },
          (payload) => {
            console.debug('❌ Center deleted via real-time:', payload.old)
            setLastUpdate(new Date())
            setIsConnected(true)
            setError(null)
            setRetryCount(0) // Reset retry count on successful event

            if (onCenterDeleted && payload.old) {
              onCenterDeleted(payload.old.id)
            }
          }
        )
        .subscribe((status, err) => {
          console.debug('Real-time subscription status:', status)

          switch (status) {
            case 'SUBSCRIBED':
              setIsConnected(true)
              setError(null)
              setRetryCount(0)
              console.debug('✅ Real-time sync connected for autism centers')
              break

            case 'CHANNEL_ERROR':
              setIsConnected(false)
              console.warn('⚠️ WebSocket channel error - switching to polling mode')
              setError('Real-time unavailable - using polling mode')
              // Don't retry on channel errors - they usually indicate configuration issues
              break

            case 'TIMED_OUT':
              setIsConnected(false)
              console.warn('⚠️ WebSocket timed out')
              if (retryCount < 2) { // Reduced retry count for faster fallback
                const delay = Math.min(3000 * (retryCount + 1), 8000) // Max 8 seconds
                console.log(`🔄 Retrying real-time connection in ${delay}ms...`)

                retryTimeoutRef.current = setTimeout(() => {
                  setRetryCount(prev => prev + 1)
                  setupSubscription()
                }, delay)
              } else {
                console.log('❌ Max retry attempts reached - switching to polling mode')
                setError('Real-time unavailable - using polling mode')
              }
              break

            case 'CLOSED':
              // Handle CLOSED status more gracefully
              console.debug('🔌 WebSocket connection closed')
              // Only treat as error if subscription still exists (unexpected closure)
              if (subscriptionRef.current) {
                setIsConnected(false)
                console.warn('⚠️ Unexpected WebSocket closure - switching to polling mode')
                setError('Connection closed - using polling mode')
              }
              break

            default:
              console.debug(`WebSocket status: ${status}`)
          }
        })

      subscriptionRef.current = subscription
    } catch (error) {
      console.error('❌ Failed to setup real-time subscription:', error)
      setIsConnected(false)
      setError(error instanceof Error ? error.message : 'Failed to setup subscription')
    }
  }, [enabled, onCenterAdded, onCenterUpdated, onCenterDeleted, retryCount, cleanup])

  useEffect(() => {
    setupSubscription()
    return cleanup
  }, [setupSubscription, cleanup])

  // Manual retry function
  const retry = useCallback(() => {
    setRetryCount(0)
    setError(null)
    setupSubscription()
  }, [setupSubscription])

  return {
    isConnected,
    lastUpdate,
    error,
    retry
  }
}

// Hook specifically for the autism center locator with fallback polling
export function useAutismCenterLocatorSync() {
  const [centers, setCenters] = useState<AutismCenter[]>([])
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleCenterAdded = useCallback((newCenter: AutismCenter) => {
    console.log('🆕 Adding new center to locator:', newCenter.name)
    setCenters(prev => {
      // Avoid duplicates
      const exists = prev.some(center => center.id === newCenter.id)
      if (exists) return prev
      return [...prev, newCenter]
    })
    setNeedsRefresh(true)
  }, [])

  const handleCenterUpdated = useCallback((updatedCenter: AutismCenter) => {
    console.debug('🔄 Updating center in locator:', updatedCenter.name)
    setCenters(prev =>
      prev.map(center =>
        center.id === updatedCenter.id ? updatedCenter : center
      )
    )
    setNeedsRefresh(true)
  }, [])

  const handleCenterDeleted = useCallback((centerId: string) => {
    console.debug('🗑️ Removing center from locator:', centerId)
    setCenters(prev => prev.filter(center => center.id !== centerId))
    setNeedsRefresh(true)
  }, [])

  // Fallback polling mechanism
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return // Already polling

    console.debug('🔄 Starting fallback polling for center updates...')
    setIsPolling(true)

    const pollForUpdates = async () => {
      try {
        // Check for updates by querying the database
        const { data, error } = await supabase
          .from('autism_centers')
          .select('id, updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)

        if (!error && data && data.length > 0) {
          const latestUpdate = new Date(data[0].updated_at)
          const lastKnownUpdate = localStorage.getItem('last_center_update')

          if (!lastKnownUpdate || new Date(lastKnownUpdate) < latestUpdate) {
            console.debug('🔄 Detected center updates via polling, triggering refresh...')
            setNeedsRefresh(true)
            localStorage.setItem('last_center_update', latestUpdate.toISOString())
          }
        }
      } catch (error) {
        console.error('❌ Polling error:', error)
      }
    }

    // Poll every 2 minutes to reduce server load
    pollingIntervalRef.current = setInterval(pollForUpdates, 120000)

    // Initial poll
    pollForUpdates()
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.debug('⏹️ Stopping fallback polling')
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
      setIsPolling(false)
    }
  }, [])

  const { isConnected, lastUpdate, error, retry } = useRealtimeCenters({
    onCenterAdded: handleCenterAdded,
    onCenterUpdated: handleCenterUpdated,
    onCenterDeleted: handleCenterDeleted
  })

  // Start polling if real-time connection fails
  useEffect(() => {
    if (!isConnected && error && !isPolling) {
      console.log('❌ Real-time connection failed, starting fallback polling...')
      startPolling()
    } else if (isConnected && isPolling) {
      console.log('✅ Real-time connection restored, stopping fallback polling...')
      stopPolling()
    }
  }, [isConnected, error, isPolling, startPolling, stopPolling])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  const markAsRefreshed = useCallback(() => {
    setNeedsRefresh(false)
  }, [])

  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refreshing center data...')
    setNeedsRefresh(true)
  }, [])

  return {
    centers,
    setCenters,
    needsRefresh,
    markAsRefreshed,
    forceRefresh,
    isConnected,
    lastUpdate,
    error,
    retry,
    isPolling
  }
}
