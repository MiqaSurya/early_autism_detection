'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface AutismCenter {
  id: string
  name: string
  type: string
  address: string
  latitude: number
  longitude: number
  phone?: string
  website?: string
  email?: string
  description?: string
  services?: string[]
  distance?: number
}

interface GeoapifyMapProps {
  centers: AutismCenter[]
  userLocation?: [number, number]
  onCenterSelect?: (center: AutismCenter) => void
  className?: string
  zoom?: number
  route?: {
    coordinates: [number, number][] // [longitude, latitude] pairs from routing API
    summary?: string
  }
  showRoute?: boolean
}

// Custom marker icons for different center types
const createCustomIcon = (type: string, isSelected: boolean = false) => {
  const colors = {
    diagnostic: isSelected ? '#dc2626' : '#ef4444',
    therapy: isSelected ? '#059669' : '#10b981',
    support: isSelected ? '#7c3aed' : '#8b5cf6',
    education: isSelected ? '#ea580c' : '#f97316',
    default: isSelected ? '#1f2937' : '#6b7280'
  }

  const color = colors[type as keyof typeof colors] || colors.default

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
        ${type.charAt(0).toUpperCase()}
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
  route,
  showRoute = true
}: GeoapifyMapProps) {
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    userLocation || [40.7589, -73.9851] // Default to NYC
  )

  useEffect(() => {
    if (userLocation) {
      setMapCenter(userLocation)
    }
  }, [userLocation])

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
  const routeCoordinates = route?.coordinates
    .filter(coord => coord.length === 2 && coord[1] >= -90 && coord[1] <= 90 && coord[0] >= -180 && coord[0] <= 180)
    .map(coord => [coord[1], coord[0]] as [number, number]) || []

  // Debug route coordinates
  useEffect(() => {
    if (route) {
      console.log('🗺️ GeoapifyMap route data:', {
        originalCoordinates: route.coordinates?.slice(0, 3),
        convertedCoordinates: routeCoordinates.slice(0, 3),
        totalPoints: route.coordinates?.length,
        showRoute,
        summary: route.summary
      })
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

        {/* Route polyline */}
        {showRoute && routeCoordinates.length > 0 && (
          <>
            <Polyline
              positions={routeCoordinates}
              color="#3b82f6"
              weight={8}
              opacity={1.0}
              dashArray="0"
            />
            {/* Debug: Log when polyline renders */}
            {console.log('🛣️ Polyline rendered with', routeCoordinates.length, 'points')}
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
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`, '_blank')}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    Get Directions
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
