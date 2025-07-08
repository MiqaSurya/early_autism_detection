'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { AutismCenter } from '@/types/location'
import { NavigationRoute } from '@/lib/navigation'

// Dynamic import for the map component to avoid SSR issues
const GeoapifyMap = dynamic(() => import('@/components/map/GeoapifyMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-blue-200 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3 mx-auto">
          <span className="text-white text-xl">🗺️</span>
        </div>
        <span className="text-blue-700">Loading map...</span>
      </div>
    </div>
  )
})

// Simple fallback component for when map fails to load
function SimpleRoutePreview({
  userLocation,
  destination,
  route,
  className = ""
}: {
  userLocation: [number, number] | null
  destination: AutismCenter
  route: NavigationRoute | null
  className?: string
}) {
  return (
    <div className={`relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-blue-200 ${className}`}>
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto">
            <span className="text-white text-2xl">🗺️</span>
          </div>
          <h3 className="text-xl font-semibold text-blue-900 mb-2">Route Preview</h3>
          <p className="text-blue-700">
            Navigation to <strong>{destination.name}</strong>
          </p>
        </div>

        {route && (
          <div className="bg-white/80 rounded-lg p-4 mb-4 border border-blue-200">
            <div className="flex items-center gap-2 text-sm mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-800">
                🛣️ Blue route: {route.summary}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              Distance: {(route.totalDistance / 1000).toFixed(1)} km •
              Time: {Math.ceil(route.totalDuration / 60)} min
            </div>
          </div>
        )}

        {!route && userLocation && (
          <div className="bg-white/80 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700">Calculating blue route...</span>
            </div>
          </div>
        )}

        <div className="text-sm text-blue-600 mt-4">
          📍 From: {userLocation ? `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}` : 'Getting location...'}
        </div>
        <div className="text-sm text-blue-600">
          🎯 To: {destination.latitude.toFixed(4)}, {destination.longitude.toFixed(4)}
        </div>
      </div>
    </div>
  )
}

interface RoutePreviewMapProps {
  userLocation: [number, number] | null
  destination: AutismCenter
  route: NavigationRoute | null
  className?: string
}

export default function RoutePreviewMap({
  userLocation,
  destination,
  route,
  className = ""
}: RoutePreviewMapProps) {
  const [mapError, setMapError] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([3.1390, 101.6869]) // Default to KL

  // Debug logging
  console.log('🗺️ RoutePreviewMap props:', {
    userLocation,
    destination: destination.name,
    route: route ? {
      summary: route.summary,
      distance: route.totalDistance,
      duration: route.totalDuration,
      coordinates: route.coordinates?.length
    } : null
  })

  useEffect(() => {
    // Prioritize user location for map centering
    if (userLocation) {
      console.log('🗺️ Centering map on user location:', userLocation)
      setMapCenter(userLocation)
    } else if (destination) {
      console.log('🗺️ Centering map on destination:', [destination.latitude, destination.longitude])
      setMapCenter([destination.latitude, destination.longitude])
    }
  }, [userLocation, destination])

  // Convert destination to the format expected by GeoapifyMap
  const centers = [{
    id: destination.id || 'destination',
    name: destination.name,
    type: destination.type || 'diagnostic', // Provide default type
    address: destination.address,
    latitude: destination.latitude,
    longitude: destination.longitude,
    phone: destination.phone,
    description: destination.description,
    verified: destination.verified || true,
    created_at: destination.created_at || new Date().toISOString(),
    updated_at: destination.updated_at || new Date().toISOString()
  }]

  // If map failed to load, show simple preview
  if (mapError) {
    return (
      <SimpleRoutePreview
        userLocation={userLocation}
        destination={destination}
        route={route}
        className={className}
      />
    )
  }

  // Show the actual map with blue route
  return (
    <div className={`relative ${className}`}>
      <div className="h-full w-full">
        <GeoapifyMap
          centers={centers}
          userLocation={userLocation || undefined}
          onCenterSelect={() => {}} // No selection needed for preview
          route={route ? {
            coordinates: route.coordinates,
            summary: route.summary
          } : undefined}
          showRoute={!!route}
          className="h-full w-full rounded-lg"
          zoom={userLocation ? 15 : 12} // Higher zoom when user location is available
          center={mapCenter} // Center map on user location or destination
        />
      </div>

      {/* Route info overlay */}
      {route && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium text-blue-800">
                🛣️ Blue route: {route.summary}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Follow the blue line to reach your destination
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {!route && userLocation && (
        <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700">Calculating blue route...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
