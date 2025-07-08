'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { AutismCenter } from '@/types/location'
import { logger } from '@/lib/logger'

// Leaflet setup (only on client side)
let L: any = null
let MapContainer: any = null
let TileLayer: any = null
let Marker: any = null
let Polyline: any = null
let useMap: any = null

if (typeof window !== 'undefined') {
  try {
    L = require('leaflet')
    require('leaflet/dist/leaflet.css')

    const ReactLeaflet = require('react-leaflet')
    MapContainer = ReactLeaflet.MapContainer
    TileLayer = ReactLeaflet.TileLayer
    Marker = ReactLeaflet.Marker
    Polyline = ReactLeaflet.Polyline
    useMap = ReactLeaflet.useMap

    // Fix for default markers in React Leaflet
    if (L && L.Icon && L.Icon.Default) {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })
    }

    // Suppress deprecation warnings for Mozilla-specific properties
    const originalConsoleWarn = console.warn
    console.warn = function(...args) {
      const message = args.join(' ')
      if (message.includes('mozPressure') || message.includes('mozInputSource')) {
        return // Suppress these specific warnings
      }
      originalConsoleWarn.apply(console, args)
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Failed to load Leaflet', { component: 'GeoapifyMap' })
    }
  }
}

interface GeoapifyMapProps {
  centers?: AutismCenter[]
  userLocation?: [number, number]
  selectedLocation?: any
  onCenterSelect?: (center: any) => void
  onClick?: (latlng: { lat: number; lng: number }) => void
  route?: {
    coordinates: [number, number][]
    summary?: any
  }
  showRoute?: boolean
  className?: string
  zoom?: number
  center?: [number, number]
}

// Helper function to validate coordinates
function isValidCoordinate(coord: [number, number] | undefined | null): coord is [number, number] {
  if (!coord || !Array.isArray(coord) || coord.length !== 2) return false
  const [lat, lon] = coord
  return typeof lat === 'number' && typeof lon === 'number' && 
         lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 &&
         !isNaN(lat) && !isNaN(lon)
}

// Create custom icons
function createUserLocationIcon() {
  if (!L) return null
  return L.divIcon({
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    className: 'user-location-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  })
}

function createCenterIcon(center: AutismCenter) {
  if (!L) return null
  
  // Color based on center type
  const getColor = (type: string) => {
    switch (type) {
      case 'diagnostic': return '#ef4444' // red
      case 'therapy': return '#10b981' // green  
      case 'support': return '#f59e0b' // amber
      case 'education': return '#8b5cf6' // purple
      default: return '#6b7280' // gray
    }
  }

  const color = getColor(center.type || 'general')
  
  return L.divIcon({
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
      ">
        🏥
      </div>
    `,
    className: 'center-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
}

// Component to handle map updates
function MapController({
  userLocation,
  centers,
  route
}: {
  userLocation?: [number, number]
  centers?: AutismCenter[]
  route?: { coordinates: [number, number][] }
}) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    // Simple initialization without complex bounds fitting
    if (userLocation && isValidCoordinate(userLocation)) {
      map.setView(userLocation, 12)
    } else {
      // Default to KL
      map.setView([3.1390, 101.6869], 12)
    }
  }, [map, userLocation])

  return null
}

// Component to handle map clicks
function MapClickHandler({ onClick }: { onClick?: (latlng: { lat: number; lng: number }) => void }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !onClick) return

    const handleClick = (e: any) => {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng })
    }

    map.on('click', handleClick)

    return () => {
      map.off('click', handleClick)
    }
  }, [map, onClick])

  return null
}

export default function GeoapifyMap({
  centers = [],
  userLocation,
  selectedLocation,
  onCenterSelect,
  onClick,
  route,
  showRoute = false,
  className = "h-full w-full",
  zoom = 12,
  center
}: GeoapifyMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  // Determine map center - memoize to prevent re-renders
  const mapCenter: [number, number] = useMemo(() =>
    center || userLocation || [3.1390, 101.6869],
    [center, userLocation]
  )

  // Convert route coordinates once and memoize
  const convertedRouteCoords = useMemo(() => {
    if (!showRoute || !route || !route.coordinates || route.coordinates.length === 0) {
      return []
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Converting route coordinates', {
        component: 'GeoapifyMap',
        metadata: {
          total: route.coordinates.length,
          sample: route.coordinates.slice(0, 3),
          isNested: Array.isArray(route.coordinates[0]) && Array.isArray(route.coordinates[0][0])
        }
      })
    }

    // Handle nested coordinates structure from Geoapify GeoJSON
    let flatCoordinates: [number, number][]

    // Check if coordinates are nested (GeoJSON LineString format)
    if (route.coordinates.length === 1 && Array.isArray(route.coordinates[0])) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Detected nested coordinates, flattening', { component: 'GeoapifyMap' })
      }
      flatCoordinates = route.coordinates[0] as [number, number][]
    } else {
      flatCoordinates = route.coordinates
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Flattened coordinates', {
        component: 'GeoapifyMap',
        metadata: {
          flatCount: flatCoordinates.length,
          sample: flatCoordinates.slice(0, 3)
        }
      })
    }

    // Geoapify returns coordinates as [longitude, latitude], but Leaflet expects [latitude, longitude]
    return flatCoordinates.map(coord => {
      if (Array.isArray(coord) && coord.length >= 2) {
        // Always assume Geoapify format: [lon, lat] -> [lat, lon]
        return [coord[1], coord[0]] as [number, number]
      }
      return coord as [number, number]
    })
  }, [showRoute, route])

  // Validate map center
  if (!isValidCoordinate(mapCenter)) {
    return (
      <div className={`${className} bg-red-50 border border-red-200 rounded-lg flex items-center justify-center`}>
        <div className="text-center p-4">
          <div className="text-red-600 mb-2">⚠️</div>
          <div className="text-sm text-red-700">Invalid map coordinates</div>
        </div>
      </div>
    )
  }

  // Don't render on server side
  if (typeof window === 'undefined' || !MapContainer) {
    return (
      <div className={`${className} bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center`}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-sm text-blue-700">Loading map...</div>
        </div>
      </div>
    )
  }

  if (mapError) {
    return (
      <div className={`${className} bg-red-50 border border-red-200 rounded-lg flex items-center justify-center`}>
        <div className="text-center p-4">
          <div className="text-red-600 mb-2">⚠️</div>
          <div className="text-sm text-red-700">{mapError}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="geoapify-map"
        zoomControl={true}
        attributionControl={true}
        whenReady={() => {
          if (process.env.NODE_ENV === 'development') {
            logger.info('Map created successfully', { component: 'GeoapifyMap' })
          }
          setMapLoaded(true)
        }}
        onError={(error: any) => {
          logger.error('Map error', error, { component: 'GeoapifyMap' })
          setMapError('Failed to load map')
        }}
      >
        {/* Geoapify tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
            ? `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          }
        />

        {/* Map controller for auto-fitting bounds */}
        <MapController
          userLocation={userLocation}
          centers={centers}
          route={route}
        />

        {/* Map click handler */}
        <MapClickHandler onClick={onClick} />

        {/* User location marker */}
        {userLocation && isValidCoordinate(userLocation) && (
          <Marker 
            position={userLocation} 
            icon={createUserLocationIcon()}
          />
        )}

        {/* Center markers */}
        {centers.map((center, index) => {
          if (!center.latitude || !center.longitude) return null
          
          const position: [number, number] = [center.latitude, center.longitude]
          if (!isValidCoordinate(position)) return null

          return (
            <Marker
              key={center.id || index}
              position={position}
              icon={createCenterIcon(center)}
              eventHandlers={{
                click: () => {
                  if (onCenterSelect) {
                    onCenterSelect(center)
                  }
                }
              }}
            />
          )
        })}

        {/* Route polyline */}
        {convertedRouteCoords.length > 0 && (
          <>
            {process.env.NODE_ENV === 'development' && (() => {
              logger.debug('Rendering blue route', {
                component: 'GeoapifyMap',
                metadata: {
                  coordinatesCount: convertedRouteCoords.length,
                  firstCoord: convertedRouteCoords[0],
                  lastCoord: convertedRouteCoords[convertedRouteCoords.length - 1]
                }
              })
              return null
            })()}

            {/* Route shadow for better visibility */}
            <Polyline
              positions={convertedRouteCoords}
              pathOptions={{
                color: "#000000",
                weight: 8,
                opacity: 0.3
              }}
            />

            {/* Main blue route line */}
            <Polyline
              positions={convertedRouteCoords}
              pathOptions={{
                color: "#3b82f6",
                weight: 5,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round"
              }}
            />
          </>
        )}
      </MapContainer>

      {!mapLoaded && (
        <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow text-sm">
          Loading map...
        </div>
      )}
    </div>
  )
}
