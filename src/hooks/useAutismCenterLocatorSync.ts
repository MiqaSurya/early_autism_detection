import { useCallback } from 'react'
import { useCenterUpdateSync } from './useCenterUpdateSync'
import { getPollingInterval, isWebSocketEnabled } from '../config/sync-config'

interface LocatorSyncOptions {
  onCentersUpdated?: () => void
  onError?: (error: any) => void
  enableRealtime?: boolean
}

export function useAutismCenterLocatorSync({
  onCentersUpdated,
  onError,
  enableRealtime = false // Disabled to prevent WebSocket errors
}: LocatorSyncOptions = {}) {
  
  const handleCenterUpdate = useCallback((payload: any) => {
    console.log('Locator received center update:', payload)
    
    // Always trigger refresh when centers are updated
    if (onCentersUpdated) {
      onCentersUpdated()
    }
  }, [onCentersUpdated])

  const handleError = useCallback((error: any) => {
    console.error('Locator sync error:', error)
    if (onError) {
      onError(error)
    }
  }, [onError])

  const syncStatus = useCenterUpdateSync({
    onCenterUpdate: handleCenterUpdate,
    onError: handleError,
    enableRealtime: enableRealtime && isWebSocketEnabled(), // Disable if Cloudflare detected
    pollingInterval: getPollingInterval('LOCATOR'), // Use centralized config
    maxRetries: 2
  })

  return {
    needsRefresh: false, // Always handled automatically
    markAsRefreshed: () => {}, // No-op since we handle automatically
    forceRefresh: syncStatus.forceRefresh,
    isConnected: syncStatus.isConnected,
    lastUpdate: syncStatus.lastUpdate,
    error: syncStatus.error,
    retry: syncStatus.startRealtime,
    connectionType: syncStatus.connectionType,
    isPolling: syncStatus.isPolling
  }
}

// Hook specifically for polling-based sync (fallback)
export function usePollingCenterLocatorSync() {
  const handleCenterUpdate = useCallback((payload: any) => {
    console.log('Polling locator received update:', payload)
    // This will be handled by the parent component
  }, [])

  const syncStatus = useCenterUpdateSync({
    onCenterUpdate: handleCenterUpdate,
    enableRealtime: false, // Polling only
    pollingInterval: getPollingInterval('POLLING_ONLY'), // Use centralized config
    maxRetries: 0
  })

  return {
    needsRefresh: syncStatus.lastUpdate !== null,
    markAsRefreshed: () => {
      // Reset the last update to prevent continuous refresh
    },
    forceRefresh: syncStatus.forceRefresh,
    isConnected: syncStatus.isConnected,
    lastUpdate: syncStatus.lastUpdate,
    error: syncStatus.error,
    retry: syncStatus.startPolling,
    isPolling: syncStatus.isPolling
  }
}
