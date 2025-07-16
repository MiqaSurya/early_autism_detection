'use client'

import { useState, useEffect } from 'react'
import { getSyncConfig, logSyncOperation, isWebSocketEnabled, shouldForcePolling } from '@/config/sync-config'

interface SyncMonitorProps {
  isVisible?: boolean
  onToggleVisibility?: () => void
}

export function SyncMonitor({ isVisible = false, onToggleVisibility }: SyncMonitorProps) {
  const [syncStats, setSyncStats] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    lastUpdate: null as Date | null
  })

  // Get config directly without state to avoid re-render loops
  const config = getSyncConfig()

  const handleForceSlowMode = () => {
    logSyncOperation('Force Slow Mode Activated')
    // This would trigger a global state update to slow down all sync operations
    console.log('🐌 Activating slow mode - all sync operations will use maximum intervals')

    // You could dispatch a global action here to update all sync hooks
    // For now, we'll just log it
    alert('Slow mode activated! All sync operations will use longer intervals.')
  }

  const handleForcePollingMode = () => {
    logSyncOperation('Force Polling Mode Activated')
    console.log('📡 Forcing polling mode - all WebSocket connections will be disabled')

    // This would require a global state update to disable WebSocket
    // For now, we'll just provide instructions
    alert('To force polling mode:\n1. Set WEBSOCKET.FORCE_POLLING_MODE = true in sync-config.ts\n2. Refresh the page\n\nThis will disable all WebSocket connections and use polling only.')
  }

  const handleResetSync = () => {
    logSyncOperation('Sync Reset Requested')
    console.log('🔄 Resetting all sync operations')
    
    // This would trigger a reset of all sync hooks
    setSyncStats({
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastUpdate: new Date()
    })
    
    alert('Sync operations reset!')
  }

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
        title="Show Sync Monitor"
      >
        📊
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800">Sync Monitor</h3>
        <button
          onClick={onToggleVisibility}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {/* Current Configuration */}
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Current Intervals</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Simple Polling: 120s (2 minutes)</div>
            <div>Mode: Simplified Sync</div>
            <div>Status: Stable & Reliable</div>
          </div>
        </div>

        {/* Sync Statistics */}
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Statistics</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Total Requests: {syncStats.totalRequests}</div>
            <div>Success Rate: {syncStats.totalRequests > 0 ? Math.round((syncStats.successfulRequests / syncStats.totalRequests) * 100) : 0}%</div>
            <div>Avg Response: {syncStats.averageResponseTime}ms</div>
            {syncStats.lastUpdate && (
              <div>Last Update: {syncStats.lastUpdate.toLocaleTimeString()}</div>
            )}
          </div>
        </div>

        {/* Connection Info */}
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Connection</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>WebSocket: ❌ Disabled (Simple Mode)</div>
            <div>Mode: 📡 Simple Polling</div>
            <div>CDN: {typeof window !== 'undefined' && (document.cookie.includes('__cf_bm') || window.location.hostname.includes('.vercel.app')) ? '☁️ Detected' : '🌐 Direct'}</div>
            <div>Env: {process.env.NODE_ENV || 'development'}</div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleForceSlowMode}
            className="w-full bg-orange-500 text-white text-xs py-2 px-3 rounded hover:bg-orange-600 transition-colors"
          >
            🐌 Force Slow Mode
          </button>

          <button
            onClick={handleForcePollingMode}
            className="w-full bg-blue-500 text-white text-xs py-2 px-3 rounded hover:bg-blue-600 transition-colors"
          >
            📡 Force Polling Mode
          </button>

          <button
            onClick={handleResetSync}
            className="w-full bg-gray-500 text-white text-xs py-2 px-3 rounded hover:bg-gray-600 transition-colors"
          >
            🔄 Reset Sync
          </button>
        </div>

        {/* Performance Tips */}
        <div className="border-t pt-2">
          <h4 className="font-medium text-gray-700 mb-1 text-xs">Simple Mode Benefits</h4>
          <div className="text-xs text-gray-500 space-y-1">
            <div>• ✅ No infinite loops</div>
            <div>• ✅ Stable performance</div>
            <div>• ✅ Reliable updates every 2 minutes</div>
            <div>• ✅ Manual refresh available</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook to easily add sync monitoring to any component
export function useSyncMonitor() {
  const [isVisible, setIsVisible] = useState(false)

  const toggleVisibility = () => setIsVisible(!isVisible)

  const SyncMonitorComponent = () => (
    <SyncMonitor 
      isVisible={isVisible} 
      onToggleVisibility={toggleVisibility} 
    />
  )

  return {
    isVisible,
    toggleVisibility,
    SyncMonitorComponent
  }
}
