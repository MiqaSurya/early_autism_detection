'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface PollingStatusProps {
  isConnected?: boolean
  lastUpdate?: Date | null
  interval?: number // in milliseconds
  className?: string
}

export default function PollingStatus({ 
  isConnected = true, 
  lastUpdate = null, 
  interval = 30000,
  className = '' 
}: PollingStatusProps) {
  const [timeAgo, setTimeAgo] = useState<string>('')

  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastUpdate) {
        setTimeAgo('Never')
        return
      }

      const now = new Date()
      const diff = now.getTime() - lastUpdate.getTime()
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)

      if (seconds < 60) {
        setTimeAgo(`${seconds}s ago`)
      } else if (minutes < 60) {
        setTimeAgo(`${minutes}m ago`)
      } else {
        setTimeAgo('Over 1h ago')
      }
    }

    updateTimeAgo()
    const timer = setInterval(updateTimeAgo, 1000)

    return () => clearInterval(timer)
  }, [lastUpdate])

  const getStatusColor = () => {
    if (!isConnected) return 'text-red-600'
    if (!lastUpdate) return 'text-gray-500'
    
    const now = new Date()
    const diff = now.getTime() - lastUpdate.getTime()
    const intervalMs = interval * 2 // Allow 2x interval before showing warning
    
    if (diff > intervalMs) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected'
    if (!lastUpdate) return 'Initializing...'
    return 'Auto-updating'
  }

  const getIcon = () => {
    if (!isConnected) {
      return <WifiOff className="h-4 w-4" />
    }
    return <Wifi className="h-4 w-4" />
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${getStatusColor()} ${className}`}>
      {getIcon()}
      <span className="font-medium">{getStatusText()}</span>
      {lastUpdate && (
        <>
          <span className="text-gray-400">•</span>
          <span>Updated {timeAgo}</span>
        </>
      )}
      <RefreshCw className="h-3 w-3 animate-spin opacity-50" />
    </div>
  )
}

// Hook to manage polling status
export function usePollingStatus(interval: number = 30000) {
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const updateStatus = () => {
    setLastUpdate(new Date())
    setIsConnected(true)
  }

  const setDisconnected = () => {
    setIsConnected(false)
  }

  useEffect(() => {
    // Initial update
    updateStatus()
  }, [])

  return {
    isConnected,
    lastUpdate,
    updateStatus,
    setDisconnected,
    interval
  }
}
