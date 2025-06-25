'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Navigation, Clock, Star, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { AutismCenter } from '@/types/location'
import { getCurrentLocation, findNearestCenter } from '@/lib/geoapify'

interface NearestCenterCardProps {
  centers: AutismCenter[]
  onCenterSelect?: (center: AutismCenter) => void
  onSaveCenter?: (center: AutismCenter) => void
  onNavigate?: (center: AutismCenter) => void
  isSaved?: (center: AutismCenter) => boolean
  className?: string
}

export default function NearestCenterCard({
  centers,
  onCenterSelect,
  onSaveCenter,
  onNavigate,
  isSaved,
  className = ""
}: NearestCenterCardProps) {
  const [nearestCenter, setNearestCenter] = useState<AutismCenter | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)

  // Find nearest center when centers or location changes
  useEffect(() => {
    if (userLocation && centers.length > 0) {
      const nearest = findNearestCenter(userLocation, centers)
      if (nearest) {
        setNearestCenter(nearest)
        // Calculate distance for display
        const dist = Math.sqrt(
          Math.pow(userLocation.lat - nearest.latitude, 2) + 
          Math.pow(userLocation.lon - nearest.longitude, 2)
        ) * 111 // Rough conversion to km
        setDistance(dist)
      }
    }
  }, [userLocation, centers])

  // Get user location on mount
  useEffect(() => {
    findNearestCenterToUser()
  }, [])

  const findNearestCenterToUser = async () => {
    if (centers.length === 0) {
      setError('No autism centers available')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const location = await getCurrentLocation()
      setUserLocation(location)
      
      const nearest = findNearestCenter(location, centers)
      if (nearest) {
        setNearestCenter(nearest)
        
        // Calculate accurate distance using Haversine formula
        const R = 6371 // Earth's radius in km
        const dLat = (nearest.latitude - location.lat) * Math.PI / 180
        const dLon = (nearest.longitude - location.lon) * Math.PI / 180
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(location.lat * Math.PI / 180) * Math.cos(nearest.latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const dist = R * c
        
        setDistance(dist)
      } else {
        setError('No autism centers found')
      }
    } catch (err) {
      console.error('Location error:', err)
      setError('Unable to get your location. Please enable location services.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetDirections = () => {
    if (nearestCenter && onNavigate) {
      onNavigate(nearestCenter)
    }
  }

  const handleCall = () => {
    if (nearestCenter?.phone) {
      window.open(`tel:${nearestCenter.phone}`)
    }
  }

  const handleSave = () => {
    if (nearestCenter && onSaveCenter) {
      onSaveCenter(nearestCenter)
    }
  }

  const handleViewOnMap = () => {
    if (nearestCenter && onCenterSelect) {
      onCenterSelect(nearestCenter)
    }
  }

  const getTypeColor = (type: string) => {
    const colors = {
      diagnostic: 'bg-blue-500',
      therapy: 'bg-green-500',
      support: 'bg-purple-500',
      education: 'bg-orange-500'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-500'
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      diagnostic: 'Diagnostic',
      therapy: 'Therapy',
      support: 'Support Group',
      education: 'Education'
    }
    return labels[type as keyof typeof labels] || type
  }

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Finding nearest autism center...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 border-red-200 bg-red-50 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-3">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p className="font-medium">Unable to find nearest center</p>
          </div>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <Button 
            onClick={findNearestCenterToUser}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  if (!nearestCenter) {
    return (
      <Card className={`p-6 border-gray-200 bg-gray-50 ${className}`}>
        <div className="text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p>No autism centers found in your area</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-blue-900 mb-1">
            🎯 Nearest Autism Center
          </h3>
          {distance && (
            <p className="text-blue-700 text-sm font-medium">
              📍 {distance.toFixed(1)} km away
            </p>
          )}
        </div>
        {isSaved && isSaved(nearestCenter) && (
          <BookmarkCheck className="h-5 w-5 text-blue-600" />
        )}
      </div>

      <div className="space-y-4">
        {/* Center Info */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-900">{nearestCenter.name}</h4>
            <span className={`inline-block px-2 py-1 text-xs rounded text-white ${getTypeColor(nearestCenter.type)}`}>
              {getTypeLabel(nearestCenter.type)}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
              <span>{nearestCenter.address}</span>
            </div>

            {nearestCenter.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{nearestCenter.phone}</span>
              </div>
            )}

            {nearestCenter.rating && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{nearestCenter.rating}/5</span>
              </div>
            )}
          </div>

          {nearestCenter.description && (
            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
              {nearestCenter.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-200">
          <Button
            onClick={handleGetDirections}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            size="sm"
            disabled={!onNavigate}
          >
            <Navigation className="h-4 w-4" />
            Navigate
          </Button>

          {nearestCenter.phone && (
            <Button
              onClick={handleCall}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
          )}

          <Button
            onClick={handleViewOnMap}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <MapPin className="h-4 w-4" />
            View on Map
          </Button>

          {onSaveCenter && (
            <Button
              onClick={handleSave}
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 ${
                isSaved && isSaved(nearestCenter)
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'border-blue-300 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {isSaved && isSaved(nearestCenter) ? (
                <>
                  <BookmarkCheck className="h-4 w-4" />
                  Remove
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white/50 rounded-lg p-3 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>🕒 Estimated travel time:</span>
            <span className="font-medium">
              {distance ? `${Math.ceil(distance * 2)} minutes` : 'Calculating...'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
