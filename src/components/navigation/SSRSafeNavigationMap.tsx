'use client'

import { useEffect, useState } from 'react'
import { NavigationRoute } from '@/lib/navigation'

interface SSRSafeNavigationMapProps {
  userLocation: [number, number]
  destination: [number, number]
  route?: NavigationRoute
  currentStepIndex?: number
  className?: string
  onLocationUpdate?: (location: [number, number]) => void
}

export default function SSRSafeNavigationMap({
  userLocation,
  destination,
  route,
  currentStepIndex = 0,
  className = "h-full w-full",
  onLocationUpdate
}: SSRSafeNavigationMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Watch user location for real-time updates
  useEffect(() => {
    if (isClient && navigator.geolocation && onLocationUpdate) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ]
          onLocationUpdate(newLocation)
        },
        (error) => {
          console.error('Location watch error:', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      )

      return () => {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [isClient, onLocationUpdate])

  const openInGoogleMaps = () => {
    const googleMapsUrl = `https://www.google.com/maps/dir/${userLocation[0]},${userLocation[1]}/${destination[0]},${destination[1]}`
    window.open(googleMapsUrl, '_blank')
  }

  const openInAppleMaps = () => {
    const appleMapsUrl = `http://maps.apple.com/?saddr=${userLocation[0]},${userLocation[1]}&daddr=${destination[0]},${destination[1]}&dirflg=d`
    window.open(appleMapsUrl, '_blank')
  }

  if (!isClient) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center`}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-blue-900 mb-2">Loading Navigation Map</div>
          <div className="text-sm text-blue-700">Preparing your route...</div>
        </div>
      </div>
    )
  }

  if (mapError) {
    return (
      <div className={`${className} bg-red-50 flex items-center justify-center`}>
        <div className="text-center p-4">
          <div className="text-red-600 mb-2">⚠️ Map Error</div>
          <div className="text-sm text-gray-600">{mapError}</div>
          <button 
            onClick={() => setMapError(null)}
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} bg-gradient-to-br from-blue-50 to-indigo-100 relative`}>
      {/* Navigation Info Overlay */}
      <div className="absolute inset-0 flex flex-col">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm p-6 border-b">
          <div className="text-center">
            <div className="text-6xl mb-4">🧭</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Navigation Active</h2>
            <p className="text-gray-600">Following route to your destination</p>
          </div>
        </div>

        {/* Route Info */}
        <div className="flex-1 p-6 flex flex-col justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {route ? `${(route.totalDistance / 1000).toFixed(1)} km` : 'Calculating...'}
                </div>
                <div className="text-sm text-gray-600">Distance</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {route ? `${Math.round(route.totalDuration / 60)} min` : 'Calculating...'}
                </div>
                <div className="text-sm text-gray-600">Time</div>
              </div>
            </div>
          </div>

          {/* Current Step */}
          {route && route.steps[currentStepIndex] && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mb-6">
              <div className="text-center">
                <div className="text-4xl mb-3">➡️</div>
                <div className="text-lg font-medium text-gray-900 mb-2">
                  {route.steps[currentStepIndex].instruction}
                </div>
                <div className="text-sm text-gray-600">
                  Step {currentStepIndex + 1} of {route.steps.length}
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {route && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-medium">
                  {Math.round(((currentStepIndex + 1) / route.steps.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStepIndex + 1) / route.steps.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* External Map Options */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                For detailed turn-by-turn navigation:
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={openInGoogleMaps}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  🗺️ Google Maps
                </button>
                
                <button
                  onClick={openInAppleMaps}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
                >
                  🍎 Apple Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Indicator */}
      <div className="absolute top-20 right-4">
        <div className="bg-blue-600 text-white p-2 rounded-full shadow-lg">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Destination Indicator */}
      <div className="absolute bottom-32 left-4">
        <div className="bg-red-600 text-white p-2 rounded-full shadow-lg">
          🏁
        </div>
      </div>
    </div>
  )
}
