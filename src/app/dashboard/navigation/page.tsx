'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Route, Clock, MapPin, Navigation } from 'lucide-react'
import NavigationMap from '@/components/navigation/NavigationMap'
import { AutismCenter } from '@/types/location'
import { parseDestinationFromParams } from '@/lib/navigation-utils'
import { getDirections, NavigationRoute } from '@/lib/navigation'
import { getCurrentLocation } from '@/lib/geoapify'

export default function NavigationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [destination, setDestination] = useState<AutismCenter | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [previewRoute, setPreviewRoute] = useState<NavigationRoute | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)


  // Get user location with better error handling
  const getUserLocation = useCallback(async () => {
    setLocationLoading(true)
    setLocationError(null)

    try {
      console.log('📍 Getting user location...')
      const location = await getCurrentLocation({
        timeout: 15000,
        enableHighAccuracy: true,
        maximumAge: 300000,
        retries: 2
      })
      console.log('📍 User location obtained:', location)
      setUserLocation([location.lat, location.lon])
      return location
    } catch (error) {
      console.error('❌ Location detection failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location'
      setLocationError(errorMessage)
      throw error
    } finally {
      setLocationLoading(false)
    }
  }, [])

  // Calculate blue route to destination
  const calculateBlueRoute = useCallback(async (dest: AutismCenter) => {
    console.log('🚀 Starting blue route calculation for:', dest.name)
    setRouteLoading(true)
    setRouteError(null)

    try {
      // Get user location first
      let location: { lat: number; lon: number }

      if (userLocation) {
        // Use existing location if available
        location = { lat: userLocation[0], lon: userLocation[1] }
        console.log('📍 Using existing user location:', location)
      } else {
        // Get fresh location
        location = await getUserLocation()
      }

      console.log('🛣️ Calculating blue route from:', location, 'to:', {
        name: dest.name,
        lat: dest.latitude,
        lon: dest.longitude
      })

      // Calculate route using navigation service for proper NavigationRoute format
      const route = await getDirections(
        { lat: location.lat, lon: location.lon },
        { lat: dest.latitude, lon: dest.longitude },
        'drive'
      )

      console.log('🔍 Route calculation result:', route)

      if (route) {
        console.log('✅ Blue route calculated successfully:', {
          summary: route.summary,
          distance: route.totalDistance,
          duration: route.totalDuration,
          coordinates: route.coordinates?.length
        })
        setPreviewRoute(route)
      } else {
        console.log('❌ Route calculation returned null')
        setRouteError('Could not calculate route to destination')
      }
    } catch (error) {
      console.error('❌ Blue route calculation failed:', error)
      if (error instanceof Error && error.message.includes('Location')) {
        setRouteError(`Location required: ${error.message}`)
      } else {
        setRouteError(`Failed to calculate route: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } finally {
      setRouteLoading(false)
    }
  }, [userLocation, getUserLocation])

  useEffect(() => {
    // Parse destination data from URL parameters
    const parsedDestination = parseDestinationFromParams(searchParams)

    if (parsedDestination) {
      setDestination(parsedDestination)
      // Automatically get location and calculate route
      initializeNavigation(parsedDestination)
    } else {
      // If no destination data, redirect back to locator
      router.push('/dashboard/locator')
    }
  }, [searchParams, router])

  // Initialize navigation with automatic location detection
  const initializeNavigation = async (dest: AutismCenter) => {
    console.log('🚀 Initializing navigation for:', dest.name)

    // Start location detection immediately
    try {
      await getUserLocation()
      // Once location is obtained, calculate route
      calculateBlueRoute(dest)
    } catch (error) {
      console.log('📍 Initial location detection failed, will retry during route calculation')
      // Still try to calculate route, which will attempt location again
      calculateBlueRoute(dest)
    }
  }

  const handleClose = () => {
    // Navigate back to the locator page
    router.push('/dashboard/locator')
  }

  const handleStartNavigation = () => {
    // Navigate to the dedicated turn-by-turn navigation page
    if (destination) {
      const params = new URLSearchParams({
        name: destination.name,
        address: destination.address,
        latitude: destination.latitude.toString(),
        longitude: destination.longitude.toString(),
        type: destination.type || 'diagnostic',
      })

      if (destination.phone) {
        params.set('phone', destination.phone)
      }

      if (destination.id) {
        params.set('id', destination.id)
      }

      router.push(`/dashboard/turn-by-turn?${params.toString()}`)
    }
  }



  const handleRetryLocation = () => {
    if (destination) {
      calculateBlueRoute(destination)
    }
  }

  const handleUseDefaultLocation = () => {
    // Use KL city center as default location
    const defaultLocation: [number, number] = [3.1390, 101.6869]
    setUserLocation(defaultLocation)
    setLocationError(null)

    if (destination) {
      // Recalculate route with default location
      calculateBlueRoute(destination)
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Locator
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Navigation</h1>
            <p className="text-sm text-gray-600 truncate">
              To: {destination.name}
            </p>
          </div>
        </div>

        {/* Location Status */}
        {locationLoading && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-yellow-800 text-sm">
              📍 Getting your location...
            </span>
          </div>
        )}

        {locationError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-800 text-sm">
                ❌ {locationError}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRetryLocation}
                size="sm"
                variant="outline"
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                🔄 Retry Location
              </Button>
              <Button
                onClick={handleUseDefaultLocation}
                size="sm"
                variant="outline"
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                📍 Use KL Center
              </Button>
            </div>
          </div>
        )}

        {userLocation && !locationError && (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-800 text-sm">
              📍 Location: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
            </span>
          </div>
        )}

        {/* Blue Route Information */}
        {routeLoading && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-800 text-sm">
              🛣️ Calculating blue route...
            </span>
          </div>
        )}

        {routeError && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-red-800 text-sm">
              ❌ {routeError}
            </span>
          </div>
        )}

        {previewRoute && !routeLoading && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div className="flex items-center gap-4 text-blue-800 text-sm">
              <span className="font-medium">
                🛣️ Blue route: {previewRoute.summary}
              </span>
              <div className="flex items-center gap-1">
                <Route className="h-3 w-3" />
                <span>{(previewRoute.totalDistance / 1000).toFixed(1)} km</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{Math.ceil(previewRoute.totalDuration / 60)} min</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Content */}
      <div className="flex-1 flex flex-col">
        <>
            {/* Navigation Map with Blue Route */}
            <div className="flex-1 p-4">
              {userLocation && previewRoute && (
                <NavigationMap
                  userLocation={userLocation}
                  destination={[destination.latitude, destination.longitude]}
                  route={previewRoute}
                  followUser={false}
                  className="h-full min-h-[400px] rounded-lg border"
                />
              )}

              {(!userLocation || !previewRoute) && (
                <div className="h-full min-h-[400px] bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border-2 border-blue-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-3 mx-auto">
                      <span className="text-white text-xl">🗺️</span>
                    </div>
                    <span className="text-blue-700">
                      {!userLocation ? 'Getting your location...' : 'Calculating route...'}
                    </span>
                  </div>
                </div>
              )}

              {/* Debug Info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                  <strong>Debug Info:</strong><br/>
                  User Location: {userLocation ? `${userLocation[0]}, ${userLocation[1]}` : 'Not set'}<br/>
                  Location Loading: {locationLoading ? 'Yes' : 'No'}<br/>
                  Location Error: {locationError || 'None'}<br/>
                  Route Loading: {routeLoading ? 'Yes' : 'No'}<br/>
                  Route Error: {routeError || 'None'}<br/>
                  Preview Route: {previewRoute ? `${previewRoute.summary}` : 'Not calculated'}<br/>
                  Destination: {destination.name} ({destination.latitude}, {destination.longitude})
                </div>
              )}
            </div>

            {/* Navigation Controls */}
            <div className="bg-white border-t p-6">
              <div className="max-w-4xl mx-auto">
                {previewRoute && !routeLoading && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-semibold">Route Summary</h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Route className="h-4 w-4" />
                          <span>{(previewRoute.totalDistance / 1000).toFixed(1)} km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{Math.ceil(previewRoute.totalDuration / 60)} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-gray-600 mb-4">
                      Best route considering current traffic conditions
                    </div>

                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-3 rounded-lg mb-6">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>🛣️ Follow the blue route on the map to reach your destination</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    onClick={handleStartNavigation}
                    disabled={!previewRoute || routeLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Navigation className="h-5 w-5 mr-2" />
                    {routeLoading ? 'Calculating Route...' : 'Start Turn-by-Turn Navigation'}
                  </Button>

                  <Button
                    onClick={() => destination && calculateBlueRoute(destination)}
                    variant="outline"
                    size="lg"
                    disabled={routeLoading}
                  >
                    🔄 Recalculate Route
                  </Button>

                  <Button
                    onClick={handleClose}
                    variant="outline"
                    size="lg"
                  >
                    Back to Locator
                  </Button>
                </div>

                {routeError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{routeError}</p>
                    <Button
                      onClick={() => destination && calculateBlueRoute(destination)}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
      </div>
    </div>
  )
}
