'use client'

import { useState, useEffect } from 'react'
import { reverseGeocodeSimple } from '@/lib/geocoding'
import { MapPin, Loader2 } from 'lucide-react'

interface AddressDisplayProps {
  latitude: number
  longitude: number
  className?: string
  showIcon?: boolean
  fallbackToCoordinates?: boolean
}

export default function AddressDisplay({
  latitude,
  longitude,
  className = "",
  showIcon = true,
  fallbackToCoordinates = true
}: AddressDisplayProps) {
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const getAddress = async () => {
      setLoading(true)
      setError(false)

      try {
        // Use your exact reverse geocoding pattern
        const lat = latitude
        const lon = longitude
        
        const alamat = await reverseGeocodeSimple(lat, lon)
        
        if (alamat) {
          setAddress(alamat)
        } else {
          throw new Error('No address found')
        }
      } catch (err) {
        console.error('Address lookup failed:', err)
        setError(true)
        
        if (fallbackToCoordinates) {
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        }
      } finally {
        setLoading(false)
      }
    }

    if (latitude && longitude) {
      getAddress()
    }
  }, [latitude, longitude, fallbackToCoordinates])

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        <span className="text-gray-500 text-sm">Getting address...</span>
      </div>
    )
  }

  if (error && !fallbackToCoordinates) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <MapPin className="h-4 w-4 text-red-400" />}
        <span className="text-red-500 text-sm">Address unavailable</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <MapPin className="h-4 w-4 text-gray-400" />}
      <span className="text-gray-700 text-sm">{address}</span>
    </div>
  )
}

// Hook version for use in other components
export function useReverseGeocode(latitude: number, longitude: number) {
  const [address, setAddress] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getAddress = async () => {
      setLoading(true)
      setError(null)

      try {
        // Your exact code pattern
        const lat = latitude
        const lon = longitude
        
        const alamat = await reverseGeocodeSimple(lat, lon)
        
        if (alamat) {
          setAddress(alamat)
        } else {
          setError('No address found')
          setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get address'
        setError(errorMessage)
        setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
      } finally {
        setLoading(false)
      }
    }

    if (latitude && longitude) {
      getAddress()
    }
  }, [latitude, longitude])

  return { address, loading, error }
}
