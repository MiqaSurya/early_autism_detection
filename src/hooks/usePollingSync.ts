import { useEffect, useRef, useState } from 'react'

interface UsePollingOptions {
  interval?: number // Polling interval in ms
  onUpdate?: () => void
  enabled?: boolean
}

export function usePollingSync({
  interval = 60000, // Default 60 seconds (1 minute)
  onUpdate,
  enabled = true
}: UsePollingOptions) {
  const [isActive, setIsActive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const startPolling = () => {
    if (intervalRef.current || !enabled) return
    
    setIsActive(true)
    intervalRef.current = setInterval(() => {
      setLastUpdate(new Date())
      if (onUpdate) {
        onUpdate()
      }
    }, interval)
  }

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsActive(false)
  }

  const triggerUpdate = () => {
    setLastUpdate(new Date())
    if (onUpdate) {
      onUpdate()
    }
  }

  useEffect(() => {
    if (enabled) {
      startPolling()
    } else {
      stopPolling()
    }

    return stopPolling
  }, [enabled, interval])

  return {
    isActive,
    lastUpdate,
    startPolling,
    stopPolling,
    triggerUpdate
  }
}

// Hook for manual refresh with visual feedback
export function useManualSync() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const refresh = async (refreshFunction: () => Promise<void> | void) => {
    setIsRefreshing(true)
    try {
      await refreshFunction()
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Refresh failed:', error)
      throw error
    } finally {
      setIsRefreshing(false)
    }
  }

  return {
    isRefreshing,
    lastRefresh,
    refresh
  }
}
