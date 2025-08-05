import { useState, useEffect, useCallback } from 'react'
import { SavedLocation } from '@/types/location'
import { useToast } from '@/hooks/use-toast'

export function useSavedLocations() {
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch all saved locations (fallback to localStorage for now)
  const fetchSavedLocations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Try API first, fallback to localStorage
      try {
        const response = await fetch('/api/saved-locations')
        if (response.ok) {
          const data = await response.json()
          setSavedLocations(data)
          setLoading(false)
          return
        }
      } catch (apiError) {
        console.log('API not available, using localStorage fallback')
      }

      // Fallback to localStorage
      const stored = localStorage.getItem('saved-autism-centers')
      if (stored) {
        const data = JSON.parse(stored)
        setSavedLocations(data)
      } else {
        setSavedLocations([])
      }
    } catch (err) {
      console.error('Error loading saved locations:', err)
      setSavedLocations([])
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Save a new location (with localStorage fallback)
  const saveLocation = async (location: Omit<SavedLocation, 'id' | 'user_id' | 'created_at'>) => {
    try {
      // Try API first
      try {
        const response = await fetch('/api/saved-locations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(location)
        })

        if (response.ok) {
          const savedLocation = await response.json()
          setSavedLocations([savedLocation, ...savedLocations])

          toast({
            title: 'Location saved',
            description: `${location.name} has been added to your saved locations.`,
          })

          return savedLocation
        }
      } catch (apiError) {
        console.log('API not available, using localStorage fallback')
      }

      // Fallback to localStorage
      const newLocation: SavedLocation = {
        id: Date.now().toString(),
        user_id: 'local-user',
        created_at: new Date().toISOString(),
        ...location
      }

      const updatedLocations = [newLocation, ...savedLocations]
      setSavedLocations(updatedLocations)
      localStorage.setItem('saved-autism-centers', JSON.stringify(updatedLocations))

      toast({
        title: 'Location saved',
        description: `${location.name} has been added to your saved locations.`,
      })

      return newLocation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')

      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save location. Please try again.',
      })

      return null
    }
  }

  // Delete a saved location
  const deleteLocation = async (id: string) => {
    try {
      // Try API first
      try {
        const response = await fetch(`/api/saved-locations/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setSavedLocations(savedLocations.filter(location => location.id !== id))

          toast({
            title: 'Location removed',
            description: 'Location has been removed from your favorites.',
          })

          return true
        }
      } catch (apiError) {
        console.log('API not available, using localStorage fallback')
      }

      // Fallback to localStorage
      const updatedLocations = savedLocations.filter(location => location.id !== id)
      setSavedLocations(updatedLocations)
      localStorage.setItem('saved-autism-centers', JSON.stringify(updatedLocations))

      toast({
        title: 'Location removed',
        description: 'Location has been removed from your favorites.',
      })

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')

      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to remove location. Please try again.',
      })

      return false
    }
  }

  // Update a saved location
  const updateLocation = async (id: string, updates: Partial<Omit<SavedLocation, 'id' | 'user_id' | 'created_at'>>) => {
    try {
      const response = await fetch(`/api/saved-locations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update location')
      }
      
      const updatedLocation = await response.json()
      
      setSavedLocations(
        savedLocations.map(location => 
          location.id === id ? updatedLocation : location
        )
      )
      
      toast({
        title: 'Location updated',
        description: `${updatedLocation.name} has been updated.`,
      })
      
      return updatedLocation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update location. Please try again.',
      })
      
      return null
    }
  }

  // Load saved locations on component mount
  useEffect(() => {
    fetchSavedLocations()
  }, [fetchSavedLocations])

  return {
    savedLocations,
    loading,
    error,
    saveLocation,
    deleteLocation,
    updateLocation,
    refreshLocations: fetchSavedLocations
  }
} 