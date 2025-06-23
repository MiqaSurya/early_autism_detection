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

/**
 * Find the nearest autism center to a given location
 */
export function findNearestCenter<T extends { latitude: number; longitude: number }>(
  userLocation: { lat: number; lon: number },
  centers: T[]
): T | null {
  if (!centers.length) return null

  let nearestCenter = centers[0]
  let shortestDistance = calculateHaversineDistance(
    userLocation.lat,
    userLocation.lon,
    nearestCenter.latitude,
    nearestCenter.longitude
  )

  for (let i = 1; i < centers.length; i++) {
    const distance = calculateHaversineDistance(
      userLocation.lat,
      userLocation.lon,
      centers[i].latitude,
      centers[i].longitude
    )

    if (distance < shortestDistance) {
      shortestDistance = distance
      nearestCenter = centers[i]
    }
  }

  return nearestCenter
}

/**
 * Sort centers by distance from user location
 */
export function sortCentersByDistance<T extends { latitude: number; longitude: number }>(
  userLocation: { lat: number; lon: number },
  centers: T[]
): (T & { distance: number })[] {
  return centers
    .map(center => ({
      ...center,
      distance: calculateHaversineDistance(
        userLocation.lat,
        userLocation.lon,
        center.latitude,
        center.longitude
      )
    }))
    .sort((a, b) => a.distance - b.distance)
}

/**
 * Filter centers within a specific radius
 */
export function filterCentersWithinRadius<T extends { latitude: number; longitude: number }>(
  userLocation: { lat: number; lon: number },
  centers: T[],
  radiusKm: number
): (T & { distance: number })[] {
  return centers
    .map(center => ({
      ...center,
      distance: calculateHaversineDistance(
        userLocation.lat,
        userLocation.lon,
        center.latitude,
        center.longitude
      )
    }))
    .filter(center => center.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
}
