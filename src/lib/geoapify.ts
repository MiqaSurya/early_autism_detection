// Geoapify API service functions

const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

if (!GEOAPIFY_API_KEY) {
  console.warn('NEXT_PUBLIC_GEOAPIFY_API_KEY is not set')
}

export interface GeoapifyPlace {
  place_id: string
  display_name: string
  lat: number
  lon: number
  address: {
    house_number?: string
    road?: string
    city?: string
    state?: string
    postcode?: string
    country?: string
  }
  bbox?: [number, number, number, number]
}

export interface GeoapifyGeocodingResponse {
  results: GeoapifyPlace[]
  query: {
    text: string
    parsed: any
  }
}

/**
 * Geocode an address using Geoapify
 */
export async function geocodeAddress(address: string): Promise<GeoapifyPlace[]> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured')
  }

  try {
    const encodedAddress = encodeURIComponent(address)
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedAddress}&apiKey=${GEOAPIFY_API_KEY}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`)
    }
    
    const data: GeoapifyGeocodingResponse = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Geocoding error:', error)
    throw error
  }
}

/**
 * Reverse geocode coordinates to get address
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeoapifyPlace | null> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured')
  }

  try {
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_API_KEY}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status} ${response.statusText}`)
    }
    
    const data: GeoapifyGeocodingResponse = await response.json()
    return data.results?.[0] || null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    throw error
  }
}

/**
 * Search for places near a location
 */
export async function searchNearby(
  lat: number, 
  lon: number, 
  query: string, 
  radius: number = 5000
): Promise<GeoapifyPlace[]> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured')
  }

  try {
    const encodedQuery = encodeURIComponent(query)
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedQuery}&filter=circle:${lon},${lat},${radius}&apiKey=${GEOAPIFY_API_KEY}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Nearby search failed: ${response.status} ${response.statusText}`)
    }
    
    const data: GeoapifyGeocodingResponse = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Nearby search error:', error)
    throw error
  }
}

/**
 * Get autocomplete suggestions for an address
 */
export async function getAutocompleteSuggestions(
  text: string,
  bias?: { lat: number; lon: number }
): Promise<GeoapifyPlace[]> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured')
  }

  if (text.length < 3) {
    return []
  }

  try {
    const encodedText = encodeURIComponent(text)
    let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodedText}&apiKey=${GEOAPIFY_API_KEY}`
    
    if (bias) {
      url += `&bias=proximity:${bias.lon},${bias.lat}`
    }
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Autocomplete failed: ${response.status} ${response.statusText}`)
    }
    
    const data: GeoapifyGeocodingResponse = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Autocomplete error:', error)
    return []
  }
}

/**
 * Calculate distance between two points using Geoapify
 */
export async function calculateDistance(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
): Promise<number> {
  // For simple distance calculation, we can use the Haversine formula
  // without needing to call the API
  return calculateHaversineDistance(from.lat, from.lon, to.lat, to.lon)
}

/**
 * Calculate distance using Haversine formula (in kilometers)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Format address from Geoapify place object
 */
export function formatAddress(place: GeoapifyPlace): string {
  const { address } = place
  const parts = []
  
  if (address.house_number && address.road) {
    parts.push(`${address.house_number} ${address.road}`)
  } else if (address.road) {
    parts.push(address.road)
  }
  
  if (address.city) {
    parts.push(address.city)
  }
  
  if (address.state) {
    parts.push(address.state)
  }
  
  if (address.postcode) {
    parts.push(address.postcode)
  }
  
  return parts.join(', ')
}

/**
 * Get current user location using browser geolocation
 */
export function getCurrentLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        })
      },
      (error) => {
        reject(error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  })
}
