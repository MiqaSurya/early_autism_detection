// Admin operations will use API routes to avoid CORS issues
// Fallback to direct Supabase client for error cases
import { supabase } from '@/lib/supabase'

export interface AutismCenter {
  id: string
  name: string
  type: 'diagnostic' | 'therapy' | 'support' | 'education'
  address: string
  latitude: number
  longitude: number
  phone?: string
  website?: string
  email?: string
  description?: string
  services?: string[]
  age_groups?: string[]
  insurance_accepted?: string[]
  rating?: number
  verified?: boolean
  created_at: string
  updated_at?: string
}

export interface CreateAutismCenterData {
  name: string
  type: 'diagnostic' | 'therapy' | 'support' | 'education'
  address: string
  latitude: number
  longitude: number
  phone?: string
  website?: string
  email?: string
  description?: string
  services?: string[]
  age_groups?: string[]
  insurance_accepted?: string[]
  rating?: number
  verified?: boolean
}

export interface UpdateAutismCenterData extends Partial<CreateAutismCenterData> {
  id: string
}

// Get all autism centers for admin management
export async function getAllAutismCenters(): Promise<AutismCenter[]> {
  console.log('📋 Loading all autism centers for admin...')

  try {
    // Use API route to avoid CORS issues
    const response = await fetch('/api/admin/autism-centers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('❌ API request failed:', response.status)
      return []
    }

    const data = await response.json()
    console.log(`✅ Loaded ${data?.length || 0} centers from API`)
    return data || []
  } catch (error) {
    console.error('❌ Error in getAllAutismCenters:', error)
    return []
  }
}

// Get autism center by ID
export async function getAutismCenterById(id: string): Promise<AutismCenter | null> {
  try {
    // Use the general API endpoint with a large radius to get all centers, then filter
    const response = await fetch('/api/autism-centers?lat=3.1390&lng=101.6869&radius=10000&limit=1000')

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const centers = await response.json()
    const center = centers.find((c: AutismCenter) => c.id === id)
    return center || null
  } catch (error) {
    console.error('Error in getAutismCenterById:', error)

    // Fallback to direct database query if API fails
    try {
      const { data, error: dbError } = await supabase
        .from('autism_centers')
        .select('*')
        .eq('id', id)
        .single()

      if (dbError) {
        if (dbError.code === 'PGRST116') {
          return null // Not found
        }
        throw new Error(`Database fallback failed: ${dbError.message}`)
      }

      return data
    } catch (fallbackError) {
      console.error('Database fallback also failed:', fallbackError)
      throw fallbackError
    }
  }
}

// Create new autism center
export async function createAutismCenter(centerData: CreateAutismCenterData): Promise<AutismCenter> {
  console.log('🆕 Creating new autism center:', centerData)

  try {
    // Use API route to avoid CORS issues
    const response = await fetch('/api/admin/autism-centers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(centerData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `API request failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ API create successful:', data)
    return data
  } catch (error) {
    console.error('❌ Error in createAutismCenter:', error)
    throw error
  }
}

// Update autism center
export async function updateAutismCenter(centerData: UpdateAutismCenterData): Promise<AutismCenter> {
  console.log('🔄 Updating autism center:', centerData)

  try {
    // Use API route to avoid CORS issues
    const response = await fetch('/api/admin/autism-centers', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(centerData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `API request failed: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ API update successful:', data)
    return data
  } catch (error) {
    console.error('❌ Error in updateAutismCenter:', error)
    throw error
  }
}

// Delete autism center
export async function deleteAutismCenter(id: string): Promise<void> {
  console.log('🗑️ Deleting autism center:', id)

  try {
    // Use API route to avoid CORS issues
    const response = await fetch(`/api/admin/autism-centers?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `API request failed: ${response.status}`)
    }

    console.log('✅ API delete successful')
  } catch (error) {
    console.error('❌ Error in deleteAutismCenter:', error)
    throw error
  }
}

// Search autism centers
export async function searchAutismCenters(searchTerm: string): Promise<AutismCenter[]> {
  try {
    // Use API endpoint for consistency
    const response = await fetch(`/api/autism-centers/search?q=${encodeURIComponent(searchTerm)}&limit=100`)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in searchAutismCenters:', error)

    // Fallback to direct database query if API fails
    try {
      const { data, error: dbError } = await supabase
        .from('autism_centers')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (dbError) {
        throw new Error(`Database fallback failed: ${dbError.message}`)
      }

      return data || []
    } catch (fallbackError) {
      console.error('Database fallback also failed:', fallbackError)
      throw fallbackError
    }
  }
}

// Get autism centers by type
export async function getAutismCentersByType(type: 'diagnostic' | 'therapy' | 'support' | 'education'): Promise<AutismCenter[]> {
  try {
    // Use API endpoint with type filter
    const response = await fetch(`/api/autism-centers?lat=3.1390&lng=101.6869&radius=10000&type=${type}&limit=1000`)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in getAutismCentersByType:', error)

    // Fallback to direct database query if API fails
    try {
      const { data, error: dbError } = await supabase
        .from('autism_centers')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false })

      if (dbError) {
        throw new Error(`Database fallback failed: ${dbError.message}`)
      }

      return data || []
    } catch (fallbackError) {
      console.error('Database fallback also failed:', fallbackError)
      throw fallbackError
    }
  }
}

// Get autism centers statistics
export async function getAutismCentersStats(): Promise<{
  total: number
  byType: Record<string, number>
  verified: number
  unverified: number
}> {
  try {
    // Use API endpoint for consistency
    const response = await fetch('/api/autism-centers/stats')

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in getAutismCentersStats:', error)

    // Fallback to direct database query if API fails
    try {
      const { data, error: dbError } = await supabase
        .from('autism_centers')
        .select('type, verified')

      if (dbError) {
        throw new Error(`Database fallback failed: ${dbError.message}`)
      }

      const stats = {
        total: data?.length || 0,
        byType: {
          diagnostic: 0,
          therapy: 0,
          support: 0,
          education: 0
        },
        verified: 0,
        unverified: 0
      }

      data?.forEach(center => {
        stats.byType[center.type] = (stats.byType[center.type] || 0) + 1
        if (center.verified) {
          stats.verified++
        } else {
          stats.unverified++
        }
      })

      return stats
    } catch (fallbackError) {
      console.error('Database fallback also failed:', fallbackError)
      throw fallbackError
    }
  }
}

// Bulk update verification status
export async function bulkUpdateVerificationStatus(centerIds: string[], verified: boolean): Promise<void> {
  try {
    // For bulk operations, we'll update each center individually through the API
    const updatePromises = centerIds.map(id =>
      updateAutismCenter({ id, verified })
    )

    await Promise.all(updatePromises)
  } catch (error) {
    console.error('Error in bulkUpdateVerificationStatus:', error)

    // Fallback to direct database update if API fails
    try {
      const { error: dbError } = await supabase
        .from('autism_centers')
        .update({ verified })
        .in('id', centerIds)

      if (dbError) {
        throw new Error(`Database fallback failed: ${dbError.message}`)
      }
    } catch (fallbackError) {
      console.error('Database fallback also failed:', fallbackError)
      throw fallbackError
    }
  }
}

// Get nearby autism centers (for map display)
export async function getNearbyAutismCenters(
  latitude: number,
  longitude: number,
  radiusKm: number = 25
): Promise<(AutismCenter & { distance: number })[]> {
  try {
    // Use API endpoint which already calculates distances
    const response = await fetch(`/api/autism-centers?lat=${latitude}&lng=${longitude}&radius=${radiusKm}&limit=1000`)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in getNearbyAutismCenters:', error)

    // Fallback to direct database query if API fails
    try {
      const { data, error: dbError } = await supabase
        .from('autism_centers')
        .select('*')

      if (dbError) {
        throw new Error(`Database fallback failed: ${dbError.message}`)
      }

      // Calculate distance for each center
      const centersWithDistance = (data || []).map(center => {
        const distance = calculateDistance(latitude, longitude, center.latitude, center.longitude)
        return {
          ...center,
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        }
      })

      // Filter by radius and sort by distance
      return centersWithDistance
        .filter(center => center.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
    } catch (fallbackError) {
      console.error('Database fallback also failed:', fallbackError)
      throw fallbackError
    }
  }
}

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
