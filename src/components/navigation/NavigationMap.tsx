'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { NavigationRoute } from '@/lib/navigation'

// Leaflet setup (only on client side)
let L: any = null
let MapContainer: any = null
let TileLayer: any = null
let Marker: any = null
let Polyline: any = null
let useMap: any = null

if (typeof window !== 'undefined') {
  L = require('leaflet')
  require('leaflet/dist/leaflet.css')

  const ReactLeaflet = require('react-leaflet')
  MapContainer = ReactLeaflet.MapContainer
  TileLayer = ReactLeaflet.TileLayer
  Marker = ReactLeaflet.Marker
  Polyline = ReactLeaflet.Polyline
  useMap = ReactLeaflet.useMap

  // Fix for default markers in React Leaflet
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

interface NavigationMapProps {
  userLocation: [number, number]
  destination: [number, number]
  route?: NavigationRoute
  currentStepIndex?: number
  followUser?: boolean
  className?: string
  onLocationUpdate?: (location: [number, number]) => void
}

// Custom icons (only create on client side)
const createUserLocationIcon = () => {
  if (!L) return null
  return L.divIcon({
    html: `
      <div style="
        background-color: #3b82f6;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 8px solid white;
          transform: translate(-50%, -50%) rotate(0deg);
        "></div>
      </div>
    `,
    className: 'user-navigation-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })
}

const createDestinationIcon = () => {
  if (!L) return null
  return L.divIcon({
    html: `
      <div style="
        background-color: #dc2626;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
      ">
        🏁
      </div>
    `,
    className: 'destination-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
}

// Component to handle map updates and following user
function MapController({
  userLocation,
  destination,
  route,
  followUser = true
}: {
  userLocation: [number, number]
  destination: [number, number]
  route?: NavigationRoute
  followUser?: boolean
}) {
  const map = useMap()

  useEffect(() => {
    // Validate coordinates before setting view
    if (followUser && userLocation && userLocation.length === 2) {
      const [lat, lon] = userLocation
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        map.setView(userLocation, 16, { animate: true, duration: 0.5 })
      } else {
        console.warn('Invalid user location coordinates:', userLocation)
      }
    }
  }, [map, userLocation, followUser])

  useEffect(() => {
    // Fit map to show route when route is loaded
    if (route && route.coordinates.length > 0) {
      try {
        // Handle nested coordinates structure from Geoapify GeoJSON
        let flatCoordinates: [number, number][]

        if (route.coordinates.length === 1 && Array.isArray(route.coordinates[0])) {
          flatCoordinates = route.coordinates[0] as unknown as [number, number][]
        } else {
          flatCoordinates = route.coordinates
        }

        const validCoords = flatCoordinates.filter(coord =>
          Array.isArray(coord) && coord.length === 2 &&
          typeof coord[1] === 'number' && coord[1] >= -90 && coord[1] <= 90 &&
          typeof coord[0] === 'number' && coord[0] >= -180 && coord[0] <= 180
        )

        if (validCoords.length > 0 && L) {
          const bounds = L.latLngBounds(
            validCoords.map(coord => [coord[1], coord[0]] as [number, number])
          )
          map.fitBounds(bounds, { padding: [20, 20] })
        }
      } catch (error) {
        console.warn('Error fitting route bounds:', error)
      }
    }
  }, [map, route])

  return null
}

// Validate coordinates helper
function isValidCoordinate(coord: [number, number]): boolean {
  return coord &&
         coord.length === 2 &&
         typeof coord[0] === 'number' &&
         typeof coord[1] === 'number' &&
         coord[0] >= -90 && coord[0] <= 90 &&
         coord[1] >= -180 && coord[1] <= 180 &&
         !isNaN(coord[0]) && !isNaN(coord[1])
}

export default function NavigationMap({
  userLocation,
  destination,
  route,
  currentStepIndex = 0,
  followUser: followUserProp = true,
  className = "h-full w-full",
  onLocationUpdate
}: NavigationMapProps) {
  const [followUser, setFollowUser] = useState(followUserProp)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)

  // Validate input coordinates
  useEffect(() => {
    if (!isValidCoordinate(userLocation)) {
      setMapError(`Invalid user location: ${JSON.stringify(userLocation)}`)
      return
    }
    if (!isValidCoordinate(destination)) {
      setMapError(`Invalid destination: ${JSON.stringify(destination)}`)
      return
    }
    setMapError(null)
  }, [userLocation, destination])

  // Watch user location for real-time updates
  useEffect(() => {
    if (navigator.geolocation && onLocationUpdate) {
      watchIdRef.current = navigator.geolocation.watchPosition(
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
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [onLocationUpdate])

  // Convert route coordinates for Leaflet (swap lon/lat) with validation
  const routeCoordinates = useMemo(() => {
    if (!route?.coordinates) {
      console.log('🧭 No route coordinates to convert')
      return []
    }

    console.log('🧭 Converting route coordinates:', {
      total: route.coordinates.length,
      sample: route.coordinates.slice(0, 3),
      isNested: Array.isArray(route.coordinates[0]) && Array.isArray(route.coordinates[0][0])
    })

    // Handle nested coordinates structure from Geoapify GeoJSON
    let flatCoordinates: [number, number][]

    // Check if coordinates are nested (GeoJSON LineString format)
    if (route.coordinates.length === 1 && Array.isArray(route.coordinates[0])) {
      console.log('🧭 Detected nested coordinates, flattening...')
      flatCoordinates = route.coordinates[0] as unknown as [number, number][]
    } else {
      flatCoordinates = route.coordinates
    }

    console.log('🧭 Flattened coordinates:', {
      flatCount: flatCoordinates.length,
      sample: flatCoordinates.slice(0, 3)
    })

    const converted = flatCoordinates
      .filter(coord => {
        const isValid = Array.isArray(coord) && coord.length === 2 &&
                       typeof coord[1] === 'number' && coord[1] >= -90 && coord[1] <= 90 &&
                       typeof coord[0] === 'number' && coord[0] >= -180 && coord[0] <= 180
        if (!isValid) {
          console.warn('🧭 Invalid coordinate filtered out:', coord)
        }
        return isValid
      })
      .map(coord => [coord[1], coord[0]] as [number, number])

    console.log('🧭 Converted coordinates:', {
      originalCount: route.coordinates.length,
      flatCount: flatCoordinates.length,
      convertedCount: converted.length,
      sample: converted.slice(0, 3)
    })

    return converted
  }, [route?.coordinates])

  // Debug route coordinates
  useEffect(() => {
    console.log('🧭 NavigationMap received route:', route)
    if (route) {
      console.log('🧭 NavigationMap route data:', {
        hasRoute: !!route,
        hasCoordinates: !!route.coordinates,
        coordinatesLength: route.coordinates?.length,
        originalCoordinates: route.coordinates?.slice(0, 3),
        convertedCoordinates: routeCoordinates.slice(0, 3),
        totalPoints: route.coordinates?.length,
        summary: route.summary
      })
    } else {
      console.log('🧭 NavigationMap: No route provided')
    }
  }, [route, routeCoordinates])

  // Safe map center with fallback
  const safeMapCenter: [number, number] = isValidCoordinate(userLocation)
    ? userLocation
    : [40.7589, -73.9851] // NYC fallback

  // Handle map loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (mapError) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
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

  // Don't render on server side
  if (typeof window === 'undefined' || !MapContainer) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center`}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-blue-900 mb-2">Loading Map</div>
          <div className="text-sm text-blue-700">Preparing navigation...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-sm text-gray-600">Loading navigation map...</div>
          </div>
        </div>
      )}

      <MapContainer
        center={safeMapCenter}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        className="navigation-map"
        zoomControl={false}
        attributionControl={false}
        whenCreated={() => setMapLoaded(true)}
        onError={(error: any) => setMapError('Failed to load map')}
      >
        {/* Geoapify tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
            ? `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          }
        />
        
        <MapController 
          userLocation={userLocation}
          destination={destination}
          route={route}
          followUser={followUser}
        />

        {/* Route polyline */}
        {routeCoordinates.length > 0 ? (
          <>
            {console.log('🧭 NavigationMap rendering route with', routeCoordinates.length, 'points')}

            {/* Route shadow for better visibility */}
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: "#000000",
                weight: 10,
                opacity: 0.5
              }}
            />

            {/* Main route line - Bright blue for navigation visibility */}
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: "#0066ff",
                weight: 6,
                opacity: 1.0,
                lineCap: "round",
                lineJoin: "round"
              }}
            />

            {/* Route highlight for extra visibility during navigation */}
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                opacity: 0.8,
                lineCap: "round",
                lineJoin: "round",
                dashArray: "5, 10"
              }}
            />
          </>
        ) : (
          <>
            {console.log('🧭 NavigationMap: No route coordinates to render')}
            {route && console.log('🧭 Route exists but no coordinates:', route)}
          </>
        )}

        {/* User location marker */}
        <Marker 
          position={userLocation} 
          icon={createUserLocationIcon()}
        />

        {/* Destination marker */}
        <Marker 
          position={destination} 
          icon={createDestinationIcon()}
        />
      </MapContainer>

      {/* Map controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setFollowUser(!followUser)}
          className={`p-2 rounded-lg shadow-lg ${
            followUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 border'
          }`}
          title={followUser ? 'Stop following' : 'Follow location'}
        >
          🧭
        </button>
        
        <button
          onClick={() => {
            // Recenter on user
            setFollowUser(true)
          }}
          className="p-2 bg-white text-gray-700 border rounded-lg shadow-lg"
          title="Center on my location"
        >
          📍
        </button>
      </div>

      {/* Route info overlay */}
      {route && routeCoordinates.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-medium">{route.summary}</span>
            </div>
            <span className="text-gray-600">
              Step {currentStepIndex + 1} of {route.steps.length}
            </span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            🛣️ Follow the blue route to your destination ({routeCoordinates.length} points)
          </div>
        </div>
      )}

      {/* Debug overlay when route exists but no coordinates */}
      {route && routeCoordinates.length === 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-100 border border-red-300 rounded-lg p-3 shadow-lg">
          <div className="text-sm text-red-700">
            ⚠️ Route calculated but no coordinates available
          </div>
          <div className="text-xs text-red-600 mt-1">
            Route: {route.summary} | Original coords: {route.coordinates?.length || 0}
          </div>
        </div>
      )}
    </div>
  )
}
