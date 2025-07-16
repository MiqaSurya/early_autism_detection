'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { AutismCenter } from '@/types/location'

interface UsePollingCentersOptions {
  onCenterAdded?: (center: AutismCenter) => void
  onCenterUpdated?: (center: AutismCenter) => void
  onCenterDeleted?: (centerId: string) => void
  enabled?: boolean
  pollingInterval?: number // in milliseconds
}

export function usePollingCenters({
  onCenterAdded,
  onCenterUpdated,
  onCenterDeleted,
  enabled = false, // Disabled by default to prevent console spam
  pollingInterval = 600000 // 10 minutes (reduced to save egress)
}: UsePollingCentersOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastKnownCentersRef = useRef<Map<string, AutismCenter>>(new Map())
  const isInitialLoadRef = useRef(true)

  const cleanup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setIsPolling(false)
  }, [])

  const checkForUpdates = useCallback(async () => {
    if (!enabled) return

    try {
      console.debug('🔄 Polling for center updates...')
      
      const { data, error: fetchError } = await supabase
        .from('autism_centers')
        .select('*')
        .order('updated_at', { ascending: false })

      if (fetchError) {
        console.error('❌ Polling error:', fetchError)
        setError(`Polling failed: ${fetchError.message}`)
        setIsConnected(false)
        return
      }

      if (!data) {
        console.debug('📊 No centers found')
        setIsConnected(true)
        setError(null)
        return
      }

      console.debug(`📊 Found ${data.length} centers`)
      
      const currentCenters = new Map<string, AutismCenter>()
      data.forEach(center => {
        currentCenters.set(center.id, center as AutismCenter)
      })

      // Skip change detection on initial load
      if (isInitialLoadRef.current) {
        lastKnownCentersRef.current = currentCenters
        isInitialLoadRef.current = false
        setIsConnected(true)
        setError(null)
        setLastUpdate(new Date())
        console.log('✅ Initial center data loaded')
        return
      }

      // Detect changes
      let hasChanges = false

      // Check for new or updated centers
      for (const [id, center] of currentCenters) {
        const lastKnown = lastKnownCentersRef.current.get(id)
        
        if (!lastKnown) {
          // New center
          console.log('🆕 New center detected:', center.name)
          hasChanges = true
          if (onCenterAdded) {
            onCenterAdded(center)
          }
        } else if (new Date(center.updated_at) > new Date(lastKnown.updated_at)) {
          // Updated center
          console.log('🔄 Updated center detected:', center.name)
          hasChanges = true
          if (onCenterUpdated) {
            onCenterUpdated(center)
          }
        }
      }

      // Check for deleted centers
      for (const [id, lastKnown] of lastKnownCentersRef.current) {
        if (!currentCenters.has(id)) {
          // Deleted center
          console.debug('🗑️ Deleted center detected:', lastKnown.name)
          hasChanges = true
          if (onCenterDeleted) {
            onCenterDeleted(id)
          }
        }
      }

      // Update our reference
      lastKnownCentersRef.current = currentCenters

      if (hasChanges) {
        setLastUpdate(new Date())
        console.debug('✅ Center changes detected and processed')
      }

      setIsConnected(true)
      setError(null)

    } catch (err) {
      console.error('❌ Polling error:', err)
      setError(err instanceof Error ? err.message : 'Polling failed')
      setIsConnected(false)
    }
  }, [enabled, onCenterAdded, onCenterUpdated, onCenterDeleted])

  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current || !enabled) return

    console.debug(`🔄 Starting polling every ${pollingInterval}ms...`)
    setIsPolling(true)
    
    // Initial check
    checkForUpdates()
    
    // Set up interval
    pollingIntervalRef.current = setInterval(checkForUpdates, pollingInterval)
  }, [enabled, pollingInterval, checkForUpdates])

  const stopPolling = useCallback(() => {
    console.debug('⏹️ Stopping polling')
    cleanup()
  }, [cleanup])

  // Start polling when enabled
  useEffect(() => {
    if (enabled) {
      startPolling()
    } else {
      stopPolling()
    }

    return cleanup
  }, [enabled, startPolling, stopPolling, cleanup])

  // Manual retry function
  const retry = useCallback(() => {
    console.log('🔄 Manual retry requested')
    setError(null)
    isInitialLoadRef.current = true
    lastKnownCentersRef.current.clear()
    
    if (enabled) {
      stopPolling()
      setTimeout(startPolling, 1000) // Restart after 1 second
    }
  }, [enabled, startPolling, stopPolling])

  // Force refresh function
  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refresh requested')
    checkForUpdates()
  }, [checkForUpdates])

  return {
    isConnected,
    lastUpdate,
    error,
    retry,
    forceRefresh,
    isPolling
  }
}

// Hook specifically for the autism center locator using polling
export function usePollingCenterLocatorSync() {
  const [centers, setCenters] = useState<AutismCenter[]>([])
  const [needsRefresh, setNeedsRefresh] = useState(false)

  const handleCenterAdded = useCallback((newCenter: AutismCenter) => {
    console.log('🆕 Adding new center to locator:', newCenter.name)
    setCenters(prev => {
      const exists = prev.some(center => center.id === newCenter.id)
      if (exists) return prev
      return [...prev, newCenter]
    })
    setNeedsRefresh(true)
  }, [])

  const handleCenterUpdated = useCallback((updatedCenter: AutismCenter) => {
    console.log('🔄 Updating center in locator:', updatedCenter.name)
    setCenters(prev => 
      prev.map(center => 
        center.id === updatedCenter.id ? updatedCenter : center
      )
    )
    setNeedsRefresh(true)
  }, [])

  const handleCenterDeleted = useCallback((centerId: string) => {
    console.log('🗑️ Removing center from locator:', centerId)
    setCenters(prev => prev.filter(center => center.id !== centerId))
    setNeedsRefresh(true)
  }, [])

  const {
    isConnected,
    lastUpdate,
    error,
    retry,
    forceRefresh,
    isPolling
  } = usePollingCenters({
    onCenterAdded: handleCenterAdded,
    onCenterUpdated: handleCenterUpdated,
    onCenterDeleted: handleCenterDeleted,
    pollingInterval: 15000 // 15 seconds
  })

  const markAsRefreshed = useCallback(() => {
    setNeedsRefresh(false)
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
