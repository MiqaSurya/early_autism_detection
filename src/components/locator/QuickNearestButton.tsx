'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Navigation, Loader2, MapPin } from 'lucide-react'
import { AutismCenter } from '@/types/location'
import { getCurrentLocation, findNearestCenter } from '@/lib/geoapify'

interface QuickNearestButtonProps {
  centers: AutismCenter[]
  onNearestFound?: (center: AutismCenter, distance: number) => void
  onNavigate?: (center: AutismCenter) => void
  className?: string
}

export default function QuickNearestButton({
  centers,
  onNearestFound,
  onNavigate,
  className = ""
}: QuickNearestButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const findAndNavigateToNearest = async () => {
    if (centers.length === 0) {
      alert('No autism centers available')
      return
    }

    setIsLoading(true)

    try {
      // Get user location
      const userLocation = await getCurrentLocation()
      
      // Find nearest center
      const nearestCenter = findNearestCenter(userLocation, centers)
      
      if (nearestCenter) {
        // Calculate distance
        const R = 6371 // Earth's radius in km
        const dLat = (nearestCenter.latitude - userLocation.lat) * Math.PI / 180
        const dLon = (nearestCenter.longitude - userLocation.lon) * Math.PI / 180
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(nearestCenter.latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distance = R * c

        // Notify parent component
        if (onNearestFound) {
          onNearestFound(nearestCenter, distance)
        }

        // Start navigation if callback provided
        if (onNavigate) {
          onNavigate(nearestCenter)
        } else {
          // Fallback to external maps
          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${nearestCenter.latitude},${nearestCenter.longitude}`
          window.open(googleMapsUrl, '_blank')
          alert(`Found nearest center: ${nearestCenter.name} (${distance.toFixed(1)} km away)\n\nOpening directions in Google Maps...`)
        }
      } else {
        alert('No autism centers found in your area')
      }
    } catch (error) {
      console.error('Error finding nearest center:', error)
      alert('Unable to get your location. Please enable location services and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={findAndNavigateToNearest}
      disabled={isLoading || centers.length === 0}
      className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Finding Nearest...
        </>
      ) : (
        <>
          <Navigation className="h-4 w-4 mr-2" />
          🎯 Find & Navigate to Nearest Center
        </>
      )}
    </Button>
  )
}
