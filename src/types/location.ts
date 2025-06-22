export type LocationType = 'diagnostic' | 'therapy' | 'support' | 'education'

export interface Location {
  id: string
  name: string
  type: LocationType
  position: {
    lat: number
    lng: number
  }
  address: string
  phone?: string
}

export interface SavedLocation {
  id: string
  user_id: string
  name: string
  type: LocationType
  address: string
  latitude: number
  longitude: number
  phone?: string
  notes?: string
  created_at: string
}

export interface AutismCenter {
  id: string
  name: string
  type: LocationType
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
  verified: boolean
  distance?: number // Added when calculating proximity
  created_at: string
  updated_at: string
}

// Convert from SavedLocation to Location format for display on map
export function savedLocationToLocation(savedLocation: SavedLocation): Location {
  return {
    id: savedLocation.id,
    name: savedLocation.name,
    type: savedLocation.type,
    position: {
      lat: savedLocation.latitude,
      lng: savedLocation.longitude
    },
    address: savedLocation.address,
    phone: savedLocation.phone
  }
} 