'use client'

import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LocationMapProps {
  latitude: number
  longitude: number
  onMapClick?: (lat: number, lng: number) => void
  height?: string
  zoom?: number
}

const LocationMap: React.FC<LocationMapProps> = ({
  latitude,
  longitude,
  onMapClick,
  height = '400px',
  zoom = 15
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView([latitude, longitude], zoom)

    // Add Geoapify tiles
    L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`, {
      attribution: '© OpenStreetMap contributors © Geoapify',
      maxZoom: 20,
    }).addTo(map)

    // Add marker
    const marker = L.marker([latitude, longitude]).addTo(map)
    
    // Handle map clicks
    if (onMapClick) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng
        onMapClick(lat, lng)
        
        // Update marker position
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        }
      })
    }

    mapInstanceRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
    }
  }, [])

  // Update marker position when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const newLatLng = L.latLng(latitude, longitude)
      markerRef.current.setLatLng(newLatLng)
      mapInstanceRef.current.setView(newLatLng, zoom)
    }
  }, [latitude, longitude, zoom])

  return (
    <div 
      ref={mapRef} 
      style={{ height, width: '100%' }}
      className="z-0"
    />
  )
}

export default LocationMap
