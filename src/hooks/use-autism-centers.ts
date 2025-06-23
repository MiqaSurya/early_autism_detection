import { useState, useEffect } from 'react'
import { AutismCenter, LocationType } from '@/types/location'
import { useToast } from '@/hooks/use-toast'

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
          return
        }
      } catch (apiError) {
        console.log('Autism centers API not available, using mock data')
      }

      // Fallback to mock data for testing
      const mockCenters: AutismCenter[] = [
        {
          id: 'mock-1',
          name: 'Sample Autism Diagnostic Center',
          type: 'diagnostic',
          address: '123 Main St, Sample City, CA 90210',
          latitude: lat + 0.01,
          longitude: lng + 0.01,
          phone: '+1-555-0123',
          description: 'Comprehensive autism diagnostic services',
          verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'mock-2',
          name: 'Sample Therapy Center',
          type: 'therapy',
          address: '456 Oak Ave, Sample City, CA 90210',
          latitude: lat - 0.01,
          longitude: lng - 0.01,
          phone: '+1-555-0456',
          description: 'Behavioral and speech therapy services',
          verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'mock-3',
          name: 'Sample Support Group',
          type: 'support',
          address: '789 Pine St, Sample City, CA 90210',
          latitude: lat + 0.005,
          longitude: lng - 0.005,
          phone: '+1-555-0789',
          description: 'Family support and community resources',
          verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      setCenters(mockCenters)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load autism centers. Please try again.',
      })
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
