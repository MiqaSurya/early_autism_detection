import { useState, useEffect } from 'react'
import { SavedLocation } from '@/types/location'
import { useToast } from '@/components/ui/use-toast'

export function useSavedLocations() {
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch all saved locations
  const fetchSavedLocations = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/saved-locations')
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved locations')
      }
      
      const data = await response.json()
      setSavedLocations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Save a new location
  const saveLocation = async (location: Omit<SavedLocation, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const response = await fetch('/api/saved-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(location)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save location')
      }
      
      const savedLocation = await response.json()
      setSavedLocations([savedLocation, ...savedLocations])
      
      toast({
        title: 'Location saved',
        description: `${location.name} has been added to your saved locations.`,
      })
      
      return savedLocation
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
      const response = await fetch(`/api/saved-locations/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete location')
      }
      
      setSavedLocations(savedLocations.filter(location => location.id !== id))
      
      toast({
        title: 'Location deleted',
        description: 'Location has been removed from your saved locations.',
      })
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete location. Please try again.',
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
  }, [])

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