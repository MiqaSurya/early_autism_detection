'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AutismCenter } from '@/types/location'

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})



interface GeoapifyMapProps {
  centers: AutismCenter[]
  userLocation?: [number, number]
  onCenterSelect?: (center: AutismCenter) => void
  className?: string
  zoom?: number
  center?: [number, number] // Optional center override
  route?: {
    coordinates: [number, number][] // [longitude, latitude] pairs from routing API
    summary?: string
  }
  showRoute?: boolean
}

// Custom marker icons for different center types
const createCustomIcon = (type: string | undefined, isSelected: boolean = false) => {
  // Provide a default type if undefined
  const safeType = type || 'default'

  const colors = {
    diagnostic: isSelected ? '#dc2626' : '#ef4444',
    therapy: isSelected ? '#059669' : '#10b981',
    support: isSelected ? '#7c3aed' : '#8b5cf6',
    education: isSelected ? '#ea580c' : '#f97316',
    default: isSelected ? '#1f2937' : '#6b7280'
  }

  const color = colors[safeType as keyof typeof colors] || colors.default

  // Get the first letter, with fallback
  const iconLetter = safeType && safeType.length > 0 ? safeType.charAt(0).toUpperCase() : 'C'

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
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
        ${iconLetter}
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  })
}

// User location marker
const createUserLocationIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        background-color: #3b82f6;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      </style>
    `,
    className: 'user-location-icon',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  })
}

// Component to handle map updates
function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])
  
  return null
}

export default function GeoapifyMap({
  centers,
  userLocation,
  onCenterSelect,
  className = "h-96 w-full",
  zoom = 13,
  center,
  route,
  showRoute = true
}: GeoapifyMapProps) {
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    center || userLocation || [3.1390, 101.6869] // Default to KL
  )

  useEffect(() => {
    // Priority: center prop > userLocation > default
    if (center) {
      console.log('🗺️ GeoapifyMap centering on provided center:', center)
      setMapCenter(center)
    } else if (userLocation) {
      console.log('🗺️ GeoapifyMap centering on user location:', userLocation)
      setMapCenter(userLocation)
    }
  }, [center, userLocation])

  const handleMarkerClick = (center: AutismCenter) => {
    setSelectedCenter(center.id)
    onCenterSelect?.(center)
  }

  const formatServices = (services?: string[]) => {
    if (!services || services.length === 0) return 'Services not specified'
    return services.join(', ')
  }

  const formatDistance = (distance?: number) => {
    if (!distance) return ''
    return distance < 1
      ? `${(distance * 1000).toFixed(0)}m away`
      : `${distance.toFixed(1)}km away`
  }

  // Convert route coordinates for Leaflet (swap lon/lat to lat/lon)
  const routeCoordinates = (() => {
    if (!route?.coordinates) return []

    let coords = route.coordinates

    // Handle LineString geometry format: coordinates is an array of [lon, lat] pairs
    // If the first element is an array, it means we have the correct format
    if (Array.isArray(coords) && coords.length > 0) {
      // Check if this is already a flat array of coordinate pairs
      if (Array.isArray(coords[0]) && coords[0].length === 2 && typeof coords[0][0] === 'number') {
        // This is the correct format: [[lon, lat], [lon, lat], ...]
        return coords
          .filter(coord => {
            if (!Array.isArray(coord) || coord.length < 2) return false
            const [lon, lat] = coord
            return typeof lat === 'number' && typeof lon === 'number' &&
                   lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 &&
                   !isNaN(lat) && !isNaN(lon)
          })
          .map(coord => {
            const [lon, lat] = coord
            return [lat, lon] as [number, number] // Convert to [lat, lon] for Leaflet
          })
      }

      // Handle nested LineString format: [[[lon, lat], [lon, lat], ...]]
      if (Array.isArray(coords[0]) && Array.isArray((coords[0] as any)[0])) {
        console.log('🔍 Detected nested LineString format, flattening...')
        coords = coords[0] as unknown as [number, number][] // Take the first (and usually only) LineString
      }

      // Now process as flat coordinate array
      return coords
        .filter(coord => {
          if (!Array.isArray(coord) || coord.length < 2) return false
          const [lon, lat] = coord
          return typeof lat === 'number' && typeof lon === 'number' &&
                 lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 &&
                 !isNaN(lat) && !isNaN(lon)
        })
        .map(coord => {
          const [lon, lat] = coord
          return [lat, lon] as [number, number] // Convert to [lat, lon] for Leaflet
        })
    }

    return []
  })()

  // Debug route coordinates with more detail
  useEffect(() => {
    if (route) {
      console.log('🗺️ GeoapifyMap route processing:', {
        hasRoute: !!route,
        showRoute,
        originalCoordinatesCount: route?.coordinates?.length || 0,
        validCoordinatesCount: routeCoordinates.length,
        firstOriginal: route?.coordinates?.[0],
        firstConverted: routeCoordinates[0],
        lastOriginal: route?.coordinates?.[route.coordinates.length - 1],
        lastConverted: routeCoordinates[routeCoordinates.length - 1],
        summary: route?.summary
      })

      // Detailed analysis of coordinate format
      if (route.coordinates && route.coordinates.length > 0) {
        const firstCoord = route.coordinates[0]
        console.log('🔍 Coordinate format analysis:', {
          firstCoordinate: firstCoord,
          coordinateType: typeof firstCoord,
          isArray: Array.isArray(firstCoord),
          length: firstCoord?.length,
          firstElement: firstCoord?.[0],
          secondElement: firstCoord?.[1],
          thirdElement: (firstCoord as any)?.[2],
          sampleCoordinates: route.coordinates.slice(0, 3)
        })
      }

      if (route.coordinates && route.coordinates.length > 0 && routeCoordinates.length === 0) {
        console.error('❌ Route coordinates were filtered out! Original coordinates:', route.coordinates.slice(0, 5))
        console.error('❌ Coordinate format issue detected. First few coordinates:', route.coordinates.slice(0, 3))
      }
    }
  }, [route, routeCoordinates, showRoute])

  return (
    <div className={className}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        {/* Geoapify tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`}
        />
        
        <MapUpdater center={mapCenter} zoom={zoom} />

        {/* Route polyline - Road-following blue route */}
        {showRoute && routeCoordinates.length > 0 && (
          <>
            {/* Debug: Log route data */}
            {console.log('🛣️ Rendering road-following route:', {
              showRoute,
              coordinatesLength: routeCoordinates.length,
              firstCoord: routeCoordinates[0],
              lastCoord: routeCoordinates[routeCoordinates.length - 1],
              routeFollowsRoads: routeCoordinates.length > 10 ? 'Yes' : 'Possibly straight line'
            })}

            {/* Route shadow for better visibility */}
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: "#000000",
                weight: 8,
                opacity: 0.4
              }}
            />

            {/* Main route line - Blue for navigation */}
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

            {/* Route highlight for extra visibility */}
            <Polyline
              positions={routeCoordinates}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                opacity: 0.7,
                lineCap: "round",
                lineJoin: "round",
                dashArray: "5, 10"
              }}
            />

            {console.log('✅ Road-following route rendered with', routeCoordinates.length, 'points')}
          </>
        )}

        {/* Debug: Show when route should render but coordinates are empty */}
        {showRoute && routeCoordinates.length === 0 && route && (
          <>
            {console.log('❌ showRoute=true but no coordinates:', {
              showRoute,
              route: route,
              originalCoordinates: route.coordinates?.length,
              filteredCoordinates: routeCoordinates.length
            })}
          </>
        )}

        {/* Debug: Show when route should render but doesn't */}
        {showRoute && routeCoordinates.length === 0 && route && (
          <>
            {console.log('❌ Route data exists but no valid coordinates:', route)}
          </>
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker 
            position={userLocation} 
            icon={createUserLocationIcon()}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-blue-600">Your Location</h3>
                <p className="text-sm text-gray-600">
                  Current position
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Autism center markers */}
        {centers.map((center) => (
          <Marker
            key={center.id}
            position={[center.latitude, center.longitude]}
            icon={createCustomIcon(center.type, selectedCenter === center.id)}
            eventHandlers={{
              click: () => handleMarkerClick(center)
            }}
          >
            <Popup>
              <div className="p-3 min-w-[250px]">
                <h3 className="font-semibold text-lg mb-2">{center.name}</h3>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Type:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      center.type === 'diagnostic' ? 'bg-red-100 text-red-800' :
                      center.type === 'therapy' ? 'bg-green-100 text-green-800' :
                      center.type === 'support' ? 'bg-purple-100 text-purple-800' :
                      center.type === 'education' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {center.type.charAt(0).toUpperCase() + center.type.slice(1)}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium">Address:</span>
                    <p className="text-gray-600">{center.address}</p>
                  </div>
                  
                  {center.phone && (
                    <div>
                      <span className="font-medium">Phone:</span>
                      <a 
                        href={`tel:${center.phone}`}
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        {center.phone}
                      </a>
                    </div>
                  )}
                  
                  {center.website && (
                    <div>
                      <span className="font-medium">Website:</span>
                      <a 
                        href={center.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium">Services:</span>
                    <p className="text-gray-600">{formatServices(center.services)}</p>
                  </div>
                  
                  {center.distance && (
                    <div className="text-blue-600 font-medium">
                      📍 {formatDistance(center.distance)}
                    </div>
                  )}
                  
                  {center.description && (
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="text-gray-600">{center.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 pt-2 border-t flex gap-2">
                  <button
                    onClick={() => {
                      const navigationUrl = `/dashboard/navigation?name=${encodeURIComponent(center.name)}&address=${encodeURIComponent(center.address)}&latitude=${center.latitude}&longitude=${center.longitude}&type=${center.type}${center.phone ? `&phone=${encodeURIComponent(center.phone)}` : ''}${center.id ? `&id=${center.id}` : ''}`
                      window.location.href = navigationUrl
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    Navigate
                  </button>
                  
                  {center.phone && (
                    <button
                      onClick={() => window.open(`tel:${center.phone}`)}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    >
                      Call
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
