const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

export interface GeocodeResult {
  latitude: number
  longitude: number
  address: string
  formatted: string
  city?: string
  state?: string
  country?: string
  postcode?: string
  confidence: number
}

export interface ReverseGeocodeResult {
  address: string
  formatted: string
  city?: string
  state?: string
  country?: string
  postcode?: string
  street?: string
  housenumber?: string
}

/**
 * Geocode an address to get coordinates
 * Based on the provided Geoapify geocoding code
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult[]> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured')
  }

  if (!address.trim()) {
    throw new Error('Address is required')
  }

  try {
    console.log('Geocoding address:', address)
    
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_API_KEY}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (!result.features || result.features.length === 0) {
      return []
    }
    
    const results: GeocodeResult[] = result.features.map((feature: any) => {
      const coordinates = feature.geometry.coordinates // [longitude, latitude]
      const properties = feature.properties
      
      return {
        latitude: coordinates[1],
        longitude: coordinates[0],
        address: address,
        formatted: properties.formatted || properties.address_line1 || address,
        city: properties.city,
        state: properties.state,
        country: properties.country,
        postcode: properties.postcode,
        confidence: properties.confidence || 0
      }
    })
    
    console.log('Geocoding results:', results)
    return results
    
  } catch (error) {
    console.error('Geocoding error:', error)
    throw error
  }
}

/**
 * Reverse geocode coordinates to get address
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured')
  }

  if (!latitude || !longitude) {
    throw new Error('Latitude and longitude are required')
  }

  try {
    console.log('Reverse geocoding coordinates:', { latitude, longitude })
    
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${GEOAPIFY_API_KEY}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (!result.features || result.features.length === 0) {
      return null
    }
    
    const feature = result.features[0]
    const properties = feature.properties
    
    const reverseResult: ReverseGeocodeResult = {
      address: properties.address_line1 || properties.formatted || 'Unknown address',
      formatted: properties.formatted || properties.address_line1 || 'Unknown address',
      city: properties.city,
      state: properties.state,
      country: properties.country,
      postcode: properties.postcode,
      street: properties.street,
      housenumber: properties.housenumber
    }
    
    console.log('Reverse geocoding result:', reverseResult)
    return reverseResult
    
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    throw error
  }
}

/**
 * Search for places/addresses with autocomplete suggestions
 */
export async function searchPlaces(query: string, options?: {
  limit?: number
  bias?: { latitude: number; longitude: number }
  countryCode?: string
}): Promise<GeocodeResult[]> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured')
  }

  if (!query.trim()) {
    return []
  }

  try {
    const params = new URLSearchParams({
      text: query,
      apiKey: GEOAPIFY_API_KEY,
      limit: (options?.limit || 5).toString()
    })
    
    // Add bias for better local results
    if (options?.bias) {
      params.append('bias', `proximity:${options.bias.longitude},${options.bias.latitude}`)
    }
    
    // Add country filter
    if (options?.countryCode) {
      params.append('filter', `countrycode:${options.countryCode}`)
    }
    
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?${params}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Place search failed: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (!result.features || result.features.length === 0) {
      return []
    }
    
    const results: GeocodeResult[] = result.features.map((feature: any) => {
      const coordinates = feature.geometry.coordinates
      const properties = feature.properties
      
      return {
        latitude: coordinates[1],
        longitude: coordinates[0],
        address: properties.address_line1 || properties.formatted || query,
        formatted: properties.formatted || properties.address_line1 || query,
        city: properties.city,
        state: properties.state,
        country: properties.country,
        postcode: properties.postcode,
        confidence: properties.confidence || 0
      }
    })
    
    return results
    
  } catch (error) {
    console.error('Place search error:', error)
    throw error
  }
}

/**
 * Geocode autism center addresses specifically for Malaysia
 */
export async function geocodeAutismCenter(centerName: string, address: string): Promise<GeocodeResult | null> {
  try {
    // Try with full address first
    let results = await geocodeAddress(`${centerName}, ${address}`)
    
    if (results.length === 0) {
      // Try with just address
      results = await geocodeAddress(address)
    }
    
    if (results.length === 0) {
      // Try with just center name
      results = await geocodeAddress(centerName)
    }
    
    if (results.length === 0) {
      return null
    }
    
    // Return the most confident result
    return results.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    )
    
  } catch (error) {
    console.error('Autism center geocoding error:', error)
    return null
  }
}

/**
 * Get user's current address from coordinates
 */
export async function getCurrentAddress(latitude: number, longitude: number): Promise<string> {
  try {
    const result = await reverseGeocode(latitude, longitude)
    return result?.formatted || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
  } catch (error) {
    console.error('Error getting current address:', error)
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
  }
}

/**
 * Validate if coordinates are in Malaysia (approximate bounds)
 */
export function isInMalaysia(latitude: number, longitude: number): boolean {
  // Malaysia approximate bounds
  const malaysiaBounds = {
    north: 7.5,
    south: 0.5,
    east: 119.5,
    west: 99.5
  }
  
  return latitude >= malaysiaBounds.south && 
         latitude <= malaysiaBounds.north && 
         longitude >= malaysiaBounds.west && 
         longitude <= malaysiaBounds.east
}
