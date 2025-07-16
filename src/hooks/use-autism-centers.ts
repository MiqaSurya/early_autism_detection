import { useState, useEffect, useRef } from 'react'
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
  forceRefresh?: boolean
  timestamp?: number
}

export function useAutismCenters(options: UseAutismCentersOptions = {}) {
  const [centers, setCenters] = useState<AutismCenter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cached, setCached] = useState(false)
  const { toast } = useToast()

  // Use useRef for cache to avoid hook order issues
  const clientCacheRef = useRef(new Map<string, { data: AutismCenter[], timestamp: number }>())
  const CACHE_DURATION = 3 * 60 * 1000 // 3 minutes

  const {
    latitude,
    longitude,
    radius = 25,
    type,
    limit = 20,
    autoFetch = true
  } = options

  // Manual fetch only - no debouncing needed

  // Fetch autism centers - Manual only (no automatic calls)
  const fetchCenters = async (customOptions?: Partial<UseAutismCentersOptions>) => {
    console.log('🔄 Manual fetchCenters called')

    const lat = customOptions?.latitude ?? latitude
    const lng = customOptions?.longitude ?? longitude
    const searchRadius = customOptions?.radius ?? radius
    const searchType = customOptions?.type ?? type
    const searchLimit = customOptions?.limit ?? limit

    if (!lat || !lng) {
      setError('Location coordinates are required')
      return
    }

    // Create cache key
    const cacheKey = `${lat}-${lng}-${searchRadius}-${searchType || 'all'}-${searchLimit}`

    // Check client cache first (unless force refresh)
    if (!customOptions?.forceRefresh) {
      const cached = clientCacheRef.current.get(cacheKey)
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        console.log('📦 Using client cache (reducing egress)')
        setCenters(cached.data)
        setCached(true)
        return cached.data
      }
    }

    if (loading) {
      console.log('🚫 Fetch already in progress')
      return centers
    }

    setLoading(true)
    setError(null)
    setCached(false)

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: searchRadius.toString(),
        limit: searchLimit.toString()
      })

      if (searchType) {
        params.append('type', searchType)
      }

      // Add cache busting parameters for force refresh
      if (customOptions?.forceRefresh) {
        params.append('_refresh', 'true')
        params.append('_t', Date.now().toString())
        console.log('🔄 Force refresh requested - bypassing server cache')
      }

      const apiUrl = `/api/autism-centers?${params}`
      console.log('🌐 Making API call to:', apiUrl)
      const response = await fetch(apiUrl)

      if (response.ok) {
        const responseData = await response.json()
        const data = responseData.centers || responseData // Handle both formats

        console.log(`✅ Fetched ${data.length} centers (cached: ${responseData.cached || false})`)

        // Store in client cache
        clientCacheRef.current.set(cacheKey, { data, timestamp: Date.now() })

        setCenters(data)
        setCached(responseData.cached || false)
        return data
      } else {
        throw new Error(`API request failed: ${response.status}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error fetching centers:', errorMessage)

      // Fallback to empty array on error
      setCenters([])
      throw err
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

  // Auto-fetch completely disabled - manual refresh only

  return {
    centers,
    loading,
    error,
    cached,
    fetchCenters,
    searchByType,
    searchByRadius,
    findNearbyWithLocation,
    refreshCenters: () => {
      console.log('🔄 Regular refresh triggered')
      if (latitude && longitude) {
        fetchCenters()
      }
    },
    clearCache: () => {
      console.log('🗑️ Clearing client cache')
      clientCacheRef.current.clear()
    }
  }
}
