'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Navigation, Route, Clock, MapPin } from 'lucide-react'
import { AutismCenter } from '@/types/location'
import { parseDestinationFromParams } from '@/lib/navigation-utils'
import { getDirections, NavigationRoute } from '@/lib/navigation'
import { getCurrentLocation } from '@/lib/geoapify'
import dynamic from 'next/dynamic'

// Dynamic import for the navigation map component to avoid SSR issues
const NavigationMap = dynamic(() => import('@/components/navigation/NavigationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3 mx-auto">
          <span className="text-white text-xl">🧭</span>
        </div>
        <span className="text-blue-700">Loading turn-by-turn navigation...</span>
      </div>
    </div>
  )
})

export default function TurnByTurnNavigationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [destination, setDestination] = useState<AutismCenter | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [route, setRoute] = useState<NavigationRoute | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [mapCenter, setMapCenter] = useState<[number, number]>([3.1390, 101.6869]) // Default to KL
  const [isTracking, setIsTracking] = useState(false)

  useEffect(() => {
    // Parse destination data from URL parameters
    const parsedDestination = parseDestinationFromParams(searchParams)
    
    if (parsedDestination) {
      setDestination(parsedDestination)
      // Start navigation immediately
      startNavigation(parsedDestination)
    } else {
      // If no destination data, redirect back to locator
      router.push('/dashboard/locator')
    }
  }, [searchParams, router])

  const startNavigation = async (dest: AutismCenter) => {
    console.log('🧭 Starting turn-by-turn navigation to:', dest.name)
    setRouteLoading(true)
    setLocationLoading(true)
    setRouteError(null)
    setLocationError(null)

    try {
      // Get user location with multiple fallback strategies
      console.log('📍 Getting user location for turn-by-turn navigation...')

      let location
      try {
        location = await getCurrentLocation({
          timeout: 20000, // Longer timeout for navigation
          enableHighAccuracy: true,
          maximumAge: 30000, // 30 seconds cache for navigation
          retries: 3 // More retries for navigation
        })
        console.log('📍 User location obtained for navigation:', location)
      } catch (locationError) {
        console.log('⚠️ Primary location detection failed, trying fallback methods...')

        // Try with lower accuracy and longer timeout
        try {
          location = await getCurrentLocation({
            timeout: 30000, // Even longer timeout
            enableHighAccuracy: false, // Lower accuracy
            maximumAge: 300000, // 5 minute cache
            retries: 2
          })
          console.log('📍 User location obtained with lower accuracy:', location)
        } catch (fallbackError) {
          console.log('⚠️ All location methods failed, using default KL location')
          // Final fallback to Kuala Lumpur coordinates
          location = { lat: 3.1390, lon: 101.6869 }
          console.log('📍 Using default location (KL):', location)

          // Show user that we're using default location
          setLocationError('Unable to get your exact location. Using Kuala Lumpur as starting point. Navigation will work but may not show your actual position.')
        }
      }

      const userPos: [number, number] = [location.lat, location.lon]
      setUserLocation(userPos)

      // Center map on user location immediately
      console.log('🗺️ Centering map on user location for navigation')
      setMapCenter(userPos)
      setLocationLoading(false)

      console.log('🛣️ Calculating turn-by-turn navigation route from:', location, 'to:', {
        name: dest.name,
        lat: dest.latitude,
        lon: dest.longitude
      })

      // Calculate route for navigation using proper NavigationRoute format
      const navigationRoute = await getDirections(
        { lat: location.lat, lon: location.lon },
        { lat: dest.latitude, lon: dest.longitude },
        'drive'
      )

      console.log('🔍 Turn-by-turn navigation route result:', navigationRoute)

      if (navigationRoute) {
        console.log('✅ Turn-by-turn navigation route calculated successfully:', {
          summary: navigationRoute.summary,
          distance: navigationRoute.totalDistance,
          duration: navigationRoute.totalDuration,
          coordinates: navigationRoute.coordinates?.length
        })
        setRoute(navigationRoute)

        // Start live location tracking for navigation
        startLiveTracking()
      } else {
        console.log('❌ Turn-by-turn navigation route calculation returned null')
        setRouteError('Could not calculate navigation route to destination')
      }
    } catch (error) {
      console.error('❌ Turn-by-turn navigation route calculation failed:', error)
      setLocationLoading(false)

      if (error instanceof Error && error.message.includes('Location')) {
        setLocationError(error.message)
        // Use destination as fallback center if location fails
        setMapCenter([dest.latitude, dest.longitude])
      } else {
        setRouteError(`Failed to calculate navigation route: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } finally {
      setRouteLoading(false)
    }
  }

  // Start live location tracking during navigation
  const startLiveTracking = () => {
    if (isTracking) return // Already tracking

    console.log('🔄 Starting live location tracking for navigation')
    setIsTracking(true)

    let consecutiveFailures = 0
    const maxFailures = 3

    const trackingInterval = setInterval(async () => {
      try {
        const location = await getCurrentLocation({
          timeout: 8000, // Shorter timeout for live tracking
          enableHighAccuracy: true,
          maximumAge: 3000, // 3 seconds cache for live tracking
          retries: 1 // Single retry for live tracking
        })

        const newPosition: [number, number] = [location.lat, location.lon]
        console.log('📍 Live location update:', newPosition)

        setUserLocation(newPosition)
        setMapCenter(newPosition) // Keep map centered on user
        consecutiveFailures = 0 // Reset failure counter on success
      } catch (error) {
        consecutiveFailures++
        console.log(`📍 Live tracking update failed (${consecutiveFailures}/${maxFailures}):`, error)

        // If too many consecutive failures, try with lower accuracy
        if (consecutiveFailures >= maxFailures) {
          console.log('⚠️ Too many location failures, trying lower accuracy mode...')
          try {
            const location = await getCurrentLocation({
              timeout: 15000,
              enableHighAccuracy: false, // Lower accuracy
              maximumAge: 10000, // 10 seconds cache
              retries: 1
            })

            const newPosition: [number, number] = [location.lat, location.lon]
            console.log('📍 Live location update (low accuracy):', newPosition)
            setUserLocation(newPosition)
            setMapCenter(newPosition)
            consecutiveFailures = 0 // Reset on success
          } catch (lowAccuracyError) {
            console.log('📍 Low accuracy tracking also failed, continuing with last known position')
            // Continue tracking but don't update position
          }
        }
      }
    }, 10000) // Update every 10 seconds

    // Store interval ID for cleanup
    ;(window as any).navigationTrackingInterval = trackingInterval
  }

  // Stop live location tracking
  const stopLiveTracking = () => {
    console.log('⏹️ Stopping live location tracking')
    setIsTracking(false)

    if ((window as any).navigationTrackingInterval) {
      clearInterval((window as any).navigationTrackingInterval)
      ;(window as any).navigationTrackingInterval = null
    }
  }

  // Cleanup tracking on component unmount
  useEffect(() => {
    return () => {
      stopLiveTracking()
    }
  }, [])

  const handleBack = () => {
    // Stop tracking when leaving navigation
    stopLiveTracking()
    // Go back to navigation preview page
    const params = new URLSearchParams({
      name: destination?.name || '',
      address: destination?.address || '',
      latitude: destination?.latitude.toString() || '',
      longitude: destination?.longitude.toString() || '',
      type: destination?.type || 'diagnostic',
    })

    if (destination?.phone) {
      params.set('phone', destination.phone)
    }

    router.push(`/dashboard/navigation?${params.toString()}`)
  }

  const handleRetryNavigation = () => {
    // Stop any existing tracking before retrying
    stopLiveTracking()

    if (destination) {
      startNavigation(destination)
    }
  }

  if (!destination) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Loading navigation...</p>
          <Button onClick={() => router.push('/dashboard/locator')}>
            Back to Locator
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              Turn-by-Turn Navigation
            </h1>
            <p className="text-sm text-gray-600 truncate">
              To: {destination.name}
            </p>
          </div>
        </div>

        {/* Navigation Status */}
        {locationLoading && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-800 text-sm">
              📍 Getting your live location for navigation...
            </span>
          </div>
        )}

        {routeLoading && !locationLoading && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-800 text-sm">
              🧭 Calculating navigation route...
            </span>
          </div>
        )}

        {locationError && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <span className="text-orange-800 text-sm">
                  ⚠️ {locationError}
                </span>
                <div className="text-xs text-orange-600 mt-1">
                  Navigation will still work, but may not show your exact position.
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRetryNavigation}
                size="sm"
                variant="outline"
                className="text-orange-700 border-orange-300 hover:bg-orange-100"
              >
                🔄 Try Again
              </Button>
              <Button
                onClick={() => {
                  // Use current location (KL default) and continue
                  setLocationError(null)
                }}
                size="sm"
                variant="outline"
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                📍 Continue with Default Location
              </Button>
            </div>
          </div>
        )}

        {userLocation && !locationLoading && (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className={`w-3 h-3 bg-green-500 rounded-full ${isTracking ? 'animate-pulse' : ''}`}></div>
            <span className="text-green-800 text-sm">
              📍 {isTracking ? 'Live tracking:' : 'Location:'} {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
              {locationError && ' (Default location)'}
            </span>
            {isTracking && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                🔄 Live
              </span>
            )}
          </div>
        )}

        {locationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-800 text-sm">
                ❌ {locationError}
              </span>
            </div>
            <Button
              onClick={handleRetryNavigation}
              size="sm"
              variant="outline"
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              🔄 Retry Navigation
            </Button>
          </div>
        )}

        {routeError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-800 text-sm">
                ❌ {routeError}
              </span>
            </div>
            <Button
              onClick={handleRetryNavigation}
              size="sm"
              variant="outline"
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              🔄 Retry Navigation
            </Button>
          </div>
        )}

        {route && !routeLoading && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="flex items-center gap-4 text-blue-800 text-sm">
              <span className="font-medium">
                🛣️ Navigation route: {route.summary}
              </span>
              <div className="flex items-center gap-1">
                <Route className="h-3 w-3" />
                <span>{(route.totalDistance / 1000).toFixed(1)} km</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{Math.ceil(route.totalDuration / 60)} min</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Screen Navigation Map */}
      <div className="flex-1 relative">
        {destination && userLocation && (
          <NavigationMap
            userLocation={userLocation}
            destination={[destination.latitude, destination.longitude]}
            route={route || undefined}
            followUser={true}
            className="h-full w-full"
          />
        )}

        {/* Navigation Instructions Overlay */}
        {route && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="font-semibold text-blue-900">
                  🧭 Follow the blue route to your destination
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Distance remaining: {(route.totalDistance / 1000).toFixed(1)} km • 
                Estimated time: {Math.ceil(route.totalDuration / 60)} minutes
              </div>
              <div className="text-xs text-blue-600 mt-2">
                📍 Destination: {destination.name}
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {routeLoading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-lg text-gray-700">Calculating navigation route...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
