import { useCallback } from 'react'
import { useCenterUpdateSync } from './useCenterUpdateSync'
import { getPollingInterval, isWebSocketEnabled } from '../config/sync-config'

interface AdminSyncOptions {
  onCentersUpdated?: () => void
  onError?: (error: any) => void
  enableRealtime?: boolean
}

export function useAdminCenterSync({
  onCentersUpdated,
  onError,
  enableRealtime = false // Disabled to prevent WebSocket errors
}: AdminSyncOptions = {}) {
  
  const handleCenterUpdate = useCallback((payload: any) => {
    console.log('Admin received center update:', payload)
    
    // Always trigger refresh when centers are updated
    if (onCentersUpdated) {
      onCentersUpdated()
    }
  }, [onCentersUpdated])

  const handleError = useCallback((error: any) => {
    console.error('Admin sync error:', error)
    if (onError) {
      onError(error)
    }
  }, [onError])

  const syncStatus = useCenterUpdateSync({
    onCenterUpdate: handleCenterUpdate,
    onError: handleError,
    enableRealtime: enableRealtime && isWebSocketEnabled(), // Disable if Cloudflare detected
    pollingInterval: getPollingInterval('ADMIN'), // Use centralized config
    maxRetries: 3
  })

  return {
    isConnected: syncStatus.isConnected,
    lastUpdate: syncStatus.lastUpdate,
    error: syncStatus.error,
    connectionType: syncStatus.connectionType,
    isPolling: syncStatus.isPolling,
    forceRefresh: syncStatus.forceRefresh,
    retry: syncStatus.startRealtime
  }
}
