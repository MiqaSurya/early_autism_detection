'use client'

import { useState } from 'react'
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '500px'
}

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
}

interface Location {
  id: string
  name: string
  type: 'diagnostic' | 'therapy' | 'support' | 'education'
  position: {
    lat: number
    lng: number
  }
  address: string
  phone?: string
}

// Mock data - replace with real API data
const mockLocations: Location[] = [
  {
    id: '1',
    name: 'Autism Diagnostic Center',
    type: 'diagnostic',
    position: { lat: 40.7128, lng: -74.0060 },
    address: '123 Main St, New York, NY',
    phone: '(555) 123-4567'
  },
  // Add more mock locations
]

export function LocationFinder() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [userLocation, setUserLocation] = useState(defaultCenter)
  const [locationType, setLocationType] = useState<Location['type'] | 'all'>('all')

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GMAPS_KEY!,
    libraries: ['places']
  })

  // Get user's location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const filteredLocations = locationType === 'all'
    ? mockLocations
    : mockLocations.filter(location => location.type === locationType)

  if (!isLoaded) {
    return (
      <div className="card">
        <p className="text-center">Loading map...</p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="space-y-2">
            <button
              onClick={getUserLocation}
              className="btn-secondary w-full mb-4"
            >
              Use My Location
            </button>
            
            <label className="block text-sm font-medium mb-1">
              Location Type
            </label>
            <select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value as Location['type'] | 'all')}
              className="w-full p-2 border rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="diagnostic">Diagnostic Centers</option>
              <option value="therapy">Therapists</option>
              <option value="support">Support Groups</option>
              <option value="education">Educational Resources</option>
            </select>
          </div>
        </div>

        {selectedLocation && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">{selectedLocation.name}</h3>
            <p className="text-neutral-600 mb-2">{selectedLocation.address}</p>
            {selectedLocation.phone && (
              <p className="text-neutral-600">{selectedLocation.phone}</p>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation.position.lat},${selectedLocation.position.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-4 inline-block"
            >
              Get Directions
            </a>
          </div>
        )}
      </div>

      <div className="md:col-span-2">
        <div className="card h-full">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={userLocation}
            zoom={12}
          >
            {filteredLocations.map((location) => (
              <MarkerF
                key={location.id}
                position={location.position}
                onClick={() => setSelectedLocation(location)}
              />
            ))}
          </GoogleMap>
        </div>
      </div>
    </div>
  )
}
