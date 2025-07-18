const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

// Debug API key
console.log('🔑 Geocoding API Key Status:', {
  hasKey: !!GEOAPIFY_API_KEY,
  keyPrefix: GEOAPIFY_API_KEY ? GEOAPIFY_API_KEY.substring(0, 8) + '...' : 'MISSING'
})

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
 * Based on your exact code pattern:
 * fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`)
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

    // Your exact code pattern
    const lat = latitude
    const lon = longitude
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_API_KEY}`

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

    // Log the exact result like your code
    console.log("Alamat:", properties.formatted)

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
 * Simple reverse geocoding that returns just the formatted address string
 * Exactly like your code example
 */
export async function reverseGeocodeSimple(lat: number, lon: number): Promise<string | null> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured')
  }

  try {
    // Your exact code pattern
    const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${GEOAPIFY_API_KEY}`)
    const result = await response.json()

    // Your exact result access
    const alamat = result.features[0].properties.formatted
    console.log("Alamat:", alamat)

    return alamat

  } catch (error) {
    console.error('Simple reverse geocoding error:', error)
    return null
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
    console.error('❌ Geoapify API key is not configured')
    throw new Error('Geoapify API key is not configured')
  }

  if (!query.trim()) {
    return []
  }

  try {
    console.log('🔍 Searching places for:', query, 'with options:', options)

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
    console.log('🌐 Request URL:', url)

    const response = await fetch(url)
    console.log('📡 Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error Response:', errorText)

      // Check if it's an API key issue
      if (response.status === 403) {
        throw new Error('Invalid API key or API key not authorized for this endpoint')
      } else if (response.status === 400) {
        throw new Error('Invalid request parameters')
      } else {
        throw new Error(`Place search failed: ${response.status} ${response.statusText}`)
      }
    }

    const result = await response.json()
    console.log('📋 API Response:', result)

    if (!result.features || result.features.length === 0) {
      console.log('ℹ️ No results found for query:', query)
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

    console.log('✅ Processed results:', results)
    return results

  } catch (error) {
    console.error('Place search error:', error)

    // Return empty array instead of throwing to prevent UI crashes
    return []
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
