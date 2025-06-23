'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Navigation, Phone, MapPin, Loader2 } from 'lucide-react'
import { useAutismCenters } from '@/hooks/use-autism-centers'
import { getCurrentLocation, findNearestCenter } from '@/lib/geoapify'

export default function EmergencyNearestCenter() {
  const [isLoading, setIsLoading] = useState(false)
  const [nearestCenter, setNearestCenter] = useState<any>(null)
  const [distance, setDistance] = useState<number | null>(null)

  const { centers, fetchCenters } = useAutismCenters({
    autoFetch: false
  })

  const findEmergencyCenter = async () => {
    setIsLoading(true)

    try {
      // Get user location
      const userLocation = await getCurrentLocation()
      
      // Fetch centers if not already loaded
      if (centers.length === 0) {
        await fetchCenters({ 
          latitude: userLocation.lat, 
          longitude: userLocation.lon, 
          radius: 50 // Wider radius for emergency
        })
      }

      // Find nearest center
      const nearest = findNearestCenter(userLocation, centers)
      
      if (nearest) {
        // Calculate distance
        const R = 6371 // Earth's radius in km
        const dLat = (nearest.latitude - userLocation.lat) * Math.PI / 180
        const dLon = (nearest.longitude - userLocation.lon) * Math.PI / 180
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(nearest.latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const dist = R * c

        setNearestCenter(nearest)
        setDistance(dist)
      } else {
        alert('No autism centers found in your area. Please try the full locator.')
      }
    } catch (error) {
      console.error('Emergency center search error:', error)
      alert('Unable to find nearest center. Please enable location services or use the full locator.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmergencyCall = () => {
    if (nearestCenter?.phone) {
      window.open(`tel:${nearestCenter.phone}`)
    } else {
      alert('No phone number available for this center')
    }
  }

  const handleEmergencyDirections = () => {
    if (nearestCenter) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${nearestCenter.latitude},${nearestCenter.longitude}`
      window.open(googleMapsUrl, '_blank')
    }
  }

  if (nearestCenter) {
    return (
      <Card className="p-6 border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              🚨 Nearest Autism Center
            </h3>
            
            <div className="space-y-2 mb-4">
              <h4 className="font-medium text-gray-900">{nearestCenter.name}</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{nearestCenter.address}</span>
              </div>
              {distance && (
                <div className="text-sm font-medium text-red-700">
                  📍 {distance.toFixed(1)} km away (~{Math.ceil(distance * 2)} min drive)
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleEmergencyDirections}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions NOW
              </Button>

              {nearestCenter.phone && (
                <Button
                  onClick={handleEmergencyCall}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  size="sm"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Center
                </Button>
              )}

              <Button
                onClick={() => {
                  setNearestCenter(null)
                  setDistance(null)
                }}
                variant="ghost"
                size="sm"
                className="text-gray-600"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-orange-100 rounded-full">
          <AlertTriangle className="h-6 w-6 text-orange-600" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-orange-900 mb-2">
            🚨 Need Immediate Help?
          </h3>
          <p className="text-sm text-orange-800 mb-4">
            Quickly find the nearest autism center for urgent support or consultation.
          </p>
          
          <Button
            onClick={findEmergencyCenter}
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Finding Nearest Center...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Find Nearest Center NOW
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
