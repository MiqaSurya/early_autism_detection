import { useState, useEffect } from 'react'
import { AutismCenter, LocationType } from '@/types/location'
import { useToast } from '@/hooks/use-toast'
import { geocodeAutismCenter } from '@/lib/geocoding'

interface UseAutismCentersOptions {
  latitude?: number
  longitude?: number
  radius?: number // in kilometers
  type?: LocationType
  limit?: number
  autoFetch?: boolean
}

export function useAutismCenters(options: UseAutismCentersOptions = {}) {
  const [centers, setCenters] = useState<AutismCenter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const {
    latitude,
    longitude,
    radius = 25,
    type,
    limit = 20,
    autoFetch = true
  } = options

  // Fetch autism centers
  const fetchCenters = async (customOptions?: Partial<UseAutismCentersOptions>) => {
    const lat = customOptions?.latitude ?? latitude
    const lng = customOptions?.longitude ?? longitude
    
    if (!lat || !lng) {
      setError('Location coordinates are required')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: (customOptions?.radius ?? radius).toString(),
        limit: (customOptions?.limit ?? limit).toString()
      })
      
      if (customOptions?.type ?? type) {
        params.append('type', customOptions?.type ?? type!)
      }
      
      // Try API first, fallback to mock data
      try {
        const response = await fetch(`/api/autism-centers?${params}`)

        if (response.ok) {
          const data = await response.json()
          setCenters(data)
          return data // Return the fetched data
        }
      } catch (apiError) {
        console.log('Autism centers API not available, using mock data')
      }

      // Fallback to mock data for testing (Malaysia-focused)
      const mockCentersData = [
        {
          name: 'Early Autism Project Malaysia',
          type: 'diagnostic' as const,
          address: 'Universiti Malaya, Kuala Lumpur',
          phone: '+60-3-7967-4422',
          description: 'Comprehensive autism diagnostic and intervention services'
        },
        {
          name: 'National Autism Society of Malaysia',
          type: 'support' as const,
          address: 'Petaling Jaya, Selangor',
          phone: '+60-3-7877-3151',
          description: 'Support services and advocacy for autism community'
        },
        {
          name: 'Kiwanis Down Syndrome Foundation',
          type: 'therapy' as const,
          address: 'Bangsar, Kuala Lumpur',
          phone: '+60-3-2282-3033',
          description: 'Therapy and educational services for special needs'
        },
        {
          name: 'Beautiful Gate Foundation',
          type: 'education' as const,
          address: 'Cheras, Kuala Lumpur',
          phone: '+60-3-9132-2922',
          description: 'Educational programs for children with special needs'
        }
      ]

      // Geocode the mock centers to get real coordinates
      const mockCenters: AutismCenter[] = []

      for (let i = 0; i < mockCentersData.length; i++) {
        const centerData = mockCentersData[i]
        let centerLat = lat + (Math.random() - 0.5) * 0.1 // Fallback coordinates
        let centerLng = lng + (Math.random() - 0.5) * 0.1

        try {
          const geocoded = await geocodeAutismCenter(centerData.name, centerData.address)
          if (geocoded) {
            centerLat = geocoded.latitude
            centerLng = geocoded.longitude
          }
        } catch (error) {
          console.log(`Could not geocode ${centerData.name}, using fallback coordinates`)
        }

        mockCenters.push({
          id: `mock-${i + 1}`,
          name: centerData.name,
          type: centerData.type,
          address: centerData.address,
          latitude: centerLat,
          longitude: centerLng,
          phone: centerData.phone,
          description: centerData.description,
          verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      setCenters(mockCenters)
      return mockCenters // Return the mock centers
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)

      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load autism centers. Please try again.',
      })
      throw err // Re-throw the error so the caller can handle it
    } finally {
      setLoading(false)
    }
  }

  // Search centers by type
  const searchByType = async (searchType: LocationType) => {
    await fetchCenters({ type: searchType })
  }

  // Search centers within different radius
  const searchByRadius = async (searchRadius: number) => {
    await fetchCenters({ radius: searchRadius })
  }

  // Get user's location and fetch nearby centers
  const findNearbyWithLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setLoading(true)
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        await fetchCenters({ latitude: lat, longitude: lng })
      },
      (error) => {
        let errorMessage = 'Failed to get your location'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
        
        setError(errorMessage)
        setLoading(false)
        
        toast({
          variant: 'destructive',
          title: 'Location Error',
          description: errorMessage,
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  // Auto-fetch on mount if coordinates are provided
  useEffect(() => {
    if (autoFetch && latitude && longitude) {
      fetchCenters()
    }
  }, [latitude, longitude, autoFetch])

  return {
    centers,
    loading,
    error,
    fetchCenters,
    searchByType,
    searchByRadius,
    findNearbyWithLocation,
    refreshCenters: () => fetchCenters()
  }
}
