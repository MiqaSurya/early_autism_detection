'use client'

import { useState, useEffect } from 'react'
import { getDirections, NavigationRoute, getCurrentStep, isOffRoute } from '@/lib/navigation'
import { getCurrentLocation } from '@/lib/geoapify'
import { AutismCenter } from '@/types/location'
import TurnByTurnNavigation from './TurnByTurnNavigation'
import NavigationMap from './NavigationMap'
import NavigationErrorBoundary from './NavigationErrorBoundary'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, Navigation, X } from 'lucide-react'

interface FullNavigationScreenProps {
  destination: AutismCenter
  onClose: () => void
}

export default function FullNavigationScreen({
  destination,
  onClose
}: FullNavigationScreenProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [route, setRoute] = useState<NavigationRoute | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isOffRouteWarning, setIsOffRouteWarning] = useState(false)

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

  const initializeNavigation = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get user location
      const location = await getCurrentLocation()
      const userPos: [number, number] = [location.lat, location.lon]
      setUserLocation(userPos)

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
    } catch (err) {
      console.error('Navigation initialization error:', err)
      setError('Failed to initialize navigation. Please check your location settings.')
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
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md mx-4">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <h2 className="text-xl font-semibold mb-2">Navigation Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2">
            <Button onClick={initializeNavigation} className="flex-1">
              Try Again
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
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
          <p className="text-gray-600 mb-4">
            Unable to find a route to {destination.name}. This may be due to location restrictions or network issues.
          </p>
          <div className="flex gap-2">
            <Button onClick={initializeNavigation} className="flex-1">
              Retry
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
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
          
          <div className="text-sm text-gray-600">
            Best route considering current traffic conditions
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
    </div>
  )
}
