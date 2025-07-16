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
    console.log('🔍 Autocomplete search for:', text)
    const encodedText = encodeURIComponent(text)
    let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodedText}&apiKey=${GEOAPIFY_API_KEY}`

    if (bias) {
      url += `&bias=proximity:${bias.lon},${bias.lat}`
    }

    console.log('🌐 Autocomplete URL:', url)
    const response = await fetch(url)
    console.log('📡 Autocomplete response:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Autocomplete API Error:', errorText)
      throw new Error(`Autocomplete failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('📋 Autocomplete data:', data)

    // The autocomplete API returns features, not results
    const features = data.features || []

    // Convert features to GeoapifyPlace format
    const places: GeoapifyPlace[] = features.map((feature: any) => {
      const coords = feature.geometry.coordinates // [lon, lat]
      const props = feature.properties

      return {
        place_id: feature.properties.place_id || `${coords[1]}-${coords[0]}`,
        display_name: props.formatted || props.address_line1 || text,
        lat: coords[1],
        lon: coords[0],
        address: {
          house_number: props.housenumber,
          road: props.street,
          city: props.city,
          state: props.state,
          postcode: props.postcode,
          country: props.country
        }
      }
    })

    console.log('✅ Converted places:', places)
    return places
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
 * Get current user location using browser geolocation with improved error handling
 */
export function getCurrentLocation(options: {
  timeout?: number
  enableHighAccuracy?: boolean
  maximumAge?: number
  retries?: number
} = {}): Promise<{ lat: number; lon: number }> {
  const {
    timeout = 30000, // Increased to 30 seconds for better reliability
    enableHighAccuracy = false, // Disabled for faster response
    maximumAge = 600000, // 10 minutes - allow cached location
    retries = 1 // Reduced retries to prevent long delays
  } = options

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    let attemptCount = 0

    const attemptLocation = () => {
      attemptCount++
      console.debug(`🌍 Location attempt ${attemptCount}/${retries + 1}`)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.debug('✅ Location obtained')
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        (error) => {
          console.debug(`❌ Location attempt ${attemptCount} failed:`, error)

          // If we have retries left and it's a timeout error, try again with less accuracy
          if (attemptCount <= retries && error.code === 3) { // TIMEOUT
            console.log('🔄 Retrying with lower accuracy...')
            setTimeout(() => {
              // Retry with lower accuracy and longer timeout
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  console.log('✅ Location obtained on retry:', {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    accuracy: position.coords.accuracy
                  })
                  resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                  })
                },
                (retryError) => {
                  console.error(`❌ Retry attempt failed:`, retryError)
                  if (attemptCount < retries) {
                    attemptLocation()
                  } else {
                    reject(createLocationError(retryError))
                  }
                },
                {
                  enableHighAccuracy: false, // Lower accuracy for retry
                  timeout: timeout + 10000, // Extra 10 seconds
                  maximumAge: maximumAge
                }
              )
            }, 1000) // Wait 1 second before retry
          } else {
            reject(createLocationError(error))
          }
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge
        }
      )
    }

    attemptLocation()
  })
}

/**
 * Create user-friendly error messages for location errors
 */
function createLocationError(error: GeolocationPositionError): Error {
  let message: string

  switch (error.code) {
    case 1: // PERMISSION_DENIED
      message = 'Location access denied. Please click the location icon in your browser\'s address bar and allow location access, then try again.'
      break
    case 2: // POSITION_UNAVAILABLE
      message = 'Location information is unavailable. This can happen due to poor GPS signal, being indoors, or network issues. Try moving to an area with better signal or near a window.'
      break
    case 3: // TIMEOUT
      message = 'Location request timed out. This often happens indoors or in areas with poor GPS signal. Try moving to an area with better signal or near a window.'
      break
    default:
      message = 'Unable to get your location. This may be due to browser settings or device limitations.'
  }

  const customError = new Error(message)
  // Preserve original error code for debugging
  ;(customError as any).originalError = error
  ;(customError as any).code = error.code

  return customError
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
