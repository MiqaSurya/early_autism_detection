'use client'

import { useState, useEffect } from 'react'
import { getDirections, NavigationRoute, getCurrentStep, isOffRoute } from '@/lib/navigation'
import { getCurrentLocation } from '@/lib/geoapify'
import { reverseGeocodeSimple } from '@/lib/geocoding'
import { AutismCenter } from '@/types/location'
import TurnByTurnNavigation from './TurnByTurnNavigation'
import NavigationMap from './NavigationMap'
import NavigationErrorBoundary from './NavigationErrorBoundary'
import ManualLocationInput from './ManualLocationInput'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, Navigation, X, MapPin } from 'lucide-react'

interface FullNavigationScreenProps {
  destination: AutismCenter
  onClose: () => void
}

export default function FullNavigationScreen({
  destination,
  onClose
}: FullNavigationScreenProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [userAddress, setUserAddress] = useState<string>('')
  const [route, setRoute] = useState<NavigationRoute | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isOffRouteWarning, setIsOffRouteWarning] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)

  // Get initial user location and calculate route
  useEffect(() => {
    initializeNavigation()
  }, [destination])

  // Monitor user location for off-route detection
  useEffect(() => {
    if (userLocation && route && isNavigating) {
      const offRoute = isOffRoute(
        { lat: userLocation[0], lon: userLocation[1] },
        route.coordinates,
        100 // 100 meter threshold
      )
      
      if (offRoute !== isOffRouteWarning) {
        setIsOffRouteWarning(offRoute)
      }
    }
  }, [userLocation, route, isNavigating, isOffRouteWarning])

  const initializeNavigation = async (useQuickLocation = false) => {
    setIsLoading(true)
    setError(null)

    try {
      // Get user location with improved options
      const locationOptions = useQuickLocation
        ? { timeout: 10000, enableHighAccuracy: false, retries: 1 } // Quick mode
        : { timeout: 20000, enableHighAccuracy: true, retries: 2 }  // Accurate mode

      const location = await getCurrentLocation(locationOptions)
      const userPos: [number, number] = [location.lat, location.lon]
      setUserLocation(userPos)

      // Get user address using reverse geocoding (your code pattern)
      try {
        const address = await reverseGeocodeSimple(location.lat, location.lon)
        if (address) {
          setUserAddress(address)
        }
      } catch (error) {
        console.log('Could not get address for user location')
        setUserAddress(`${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`)
      }

      console.log('Navigation initialization:', {
        userLocation: location,
        destination: { lat: destination.latitude, lon: destination.longitude },
        destinationName: destination.name
      })

      // Validate destination coordinates
      if (!destination.latitude || !destination.longitude ||
          destination.latitude < -90 || destination.latitude > 90 ||
          destination.longitude < -180 || destination.longitude > 180) {
        throw new Error(`Invalid destination coordinates: ${destination.latitude}, ${destination.longitude}`)
      }

      // Calculate route
      const calculatedRoute = await getDirections(
        { lat: location.lat, lon: location.lon },
        { lat: destination.latitude, lon: destination.longitude },
        'drive'
      )

      if (calculatedRoute) {
        setRoute(calculatedRoute)
      } else {
        setError('Unable to calculate route to destination')
      }
    } catch (err: any) {
      console.error('Navigation initialization error:', err)

      // Provide specific error messages based on error type
      let errorMessage = 'Failed to initialize navigation.'

      if (err.code === 1) { // PERMISSION_DENIED
        errorMessage = 'Location access denied. Please enable location services and try again.'
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        errorMessage = 'Location unavailable. Please check your internet connection.'
      } else if (err.code === 3) { // TIMEOUT
        errorMessage = 'Location request timed out. Try moving to an area with better signal or use quick location mode.'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartNavigation = () => {
    setIsNavigating(true)
  }

  const handleRecalculateRoute = async () => {
    if (!userLocation) return

    setIsLoading(true)
    setError(null)
    setIsOffRouteWarning(false)

    try {
      const newRoute = await getDirections(
        { lat: userLocation[0], lon: userLocation[1] },
        { lat: destination.latitude, lon: destination.longitude },
        'drive'
      )

      if (newRoute) {
        setRoute(newRoute)
      } else {
        setError('Unable to recalculate route')
      }
    } catch (err) {
      console.error('Route recalculation error:', err)
      setError('Failed to recalculate route')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationUpdate = (newLocation: [number, number]) => {
    setUserLocation(newLocation)
  }

  const handleManualLocationSelect = async (location: { lat: number; lon: number; address: string }) => {
    setShowManualInput(false)
    setIsLoading(true)
    setError(null)

    try {
      const userPos: [number, number] = [location.lat, location.lon]
      setUserLocation(userPos)
      setUserAddress(location.address)

      console.log('Manual location selected:', {
        userLocation: location,
        destination: { lat: destination.latitude, lon: destination.longitude },
        destinationName: destination.name
      })

      // Calculate route from manual location
      const calculatedRoute = await getDirections(
        { lat: location.lat, lon: location.lon },
        { lat: destination.latitude, lon: destination.longitude },
        'drive'
      )

      if (calculatedRoute) {
        setRoute(calculatedRoute)
      } else {
        setError('Unable to calculate route from the selected location')
      }
    } catch (err: any) {
      console.error('Manual location route calculation error:', err)
      setError('Failed to calculate route from the selected location')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">Calculating Route</h2>
          <p className="text-gray-600">Getting directions to {destination.name}...</p>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    const isLocationError = error.includes('Location') || error.includes('timed out') || error.includes('denied')

    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md mx-4">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <h2 className="text-xl font-semibold mb-2">Navigation Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>

          {isLocationError ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button onClick={() => initializeNavigation(false)} className="flex-1">
                  Try Again (Accurate)
                </Button>
                <Button onClick={() => initializeNavigation(true)} variant="outline" className="flex-1">
                  Quick Mode
                </Button>
              </div>
              <div className="text-xs text-gray-500">
                Quick mode uses less accurate but faster location detection
              </div>
              <Button
                onClick={() => setShowManualInput(true)}
                variant="outline"
                className="w-full"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Enter Location Manually
              </Button>
              <Button onClick={onClose} variant="ghost" className="w-full">
                Cancel Navigation
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => initializeNavigation(false)} className="flex-1">
                Try Again
              </Button>
              <Button onClick={onClose} variant="outline" className="flex-1">
                Close
              </Button>
            </div>
          )}
        </Card>
      </div>
    )
  }

  // No route found
  if (!route || !userLocation) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md mx-4">
          <Navigation className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-semibold mb-2">No Route Available</h2>
          <p className="text-gray-600 mb-6">
            Unable to find a route to {destination.name}. This may be due to location restrictions or network issues.
          </p>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button onClick={() => initializeNavigation(false)} className="flex-1">
                Retry (Accurate)
              </Button>
              <Button onClick={() => initializeNavigation(true)} variant="outline" className="flex-1">
                Quick Retry
              </Button>
            </div>
            <Button
              onClick={() => setShowManualInput(true)}
              variant="outline"
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Enter Location Manually
            </Button>
            <Button onClick={onClose} variant="ghost" className="w-full">
              Cancel Navigation
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Navigation active - show turn-by-turn interface
  if (isNavigating) {
    return (
      <div className="fixed inset-0 z-50">
        {/* Off-route warning */}
        {isOffRouteWarning && (
          <div className="absolute top-20 left-4 right-4 z-10">
            <Card className="p-4 bg-orange-50 border-orange-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-medium text-orange-800">Off Route</p>
                  <p className="text-sm text-orange-700">Recalculating route...</p>
                </div>
                <Button
                  onClick={handleRecalculateRoute}
                  size="sm"
                  variant="outline"
                  className="border-orange-300"
                >
                  Recalculate
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Navigation Map */}
        <NavigationMap
          userLocation={userLocation}
          destination={[destination.latitude, destination.longitude]}
          route={route}
          onLocationUpdate={handleLocationUpdate}
          className="absolute inset-0"
        />

        {/* Turn-by-turn overlay */}
        <NavigationErrorBoundary>
          <TurnByTurnNavigation
            route={route}
            userLocation={userLocation}
            destination={{
              name: destination.name,
              address: destination.address,
              phone: destination.phone,
              latitude: destination.latitude,
              longitude: destination.longitude
            }}
            onClose={() => setIsNavigating(false)}
            onRecalculate={handleRecalculateRoute}
            onLocationUpdate={handleLocationUpdate}
          />
        </NavigationErrorBoundary>
      </div>
    )
  }

  // Route preview - show before starting navigation
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Route to {destination.name}</h1>
          <p className="text-gray-600 text-sm">{destination.address}</p>
          {userAddress && (
            <p className="text-blue-600 text-xs mt-1">From: {userAddress}</p>
          )}
        </div>
        <Button onClick={onClose} variant="ghost" size="sm">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Route Preview Map */}
      <div className="flex-1">
        <NavigationMap
          userLocation={userLocation}
          destination={[destination.latitude, destination.longitude]}
          route={route}
          className="h-full"
        />
      </div>

      {/* Route Info and Start Button */}
      <div className="bg-white border-t p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold">{route.summary}</span>
            <span className="text-sm text-gray-600">
              {route.steps.length} steps
            </span>
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            Best route considering current traffic conditions
          </div>

          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>🛣️ Follow the blue route on the map to reach your destination</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleStartNavigation}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Navigation className="h-5 w-5 mr-2" />
            Start Navigation
          </Button>
          
          <Button
            onClick={onClose}
            variant="outline"
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Manual Location Input Modal */}
      {showManualInput && (
        <ManualLocationInput
          onLocationSelect={handleManualLocationSelect}
          onClose={() => setShowManualInput(false)}
          destinationName={destination.name}
        />
      )}
    </div>
  )
}
