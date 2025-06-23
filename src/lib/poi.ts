const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

export interface POIPlace {
  id: string
  name: string
  category: string
  subcategory?: string
  latitude: number
  longitude: number
  address: string
  formatted: string
  distance?: number
  phone?: string
  website?: string
  opening_hours?: string
  rating?: number
  wheelchair_accessible?: boolean
  properties: any // Raw properties from API
}

export interface POISearchOptions {
  categories?: string[]
  radius?: number // in meters
  limit?: number
  bias?: { latitude: number; longitude: number }
  filter?: 'circle' | 'rect'
  countryCode?: string
}

// Healthcare categories relevant to autism centers
export const HEALTHCARE_CATEGORIES = {
  HOSPITAL: 'healthcare.hospital',
  CLINIC: 'healthcare.clinic_or_praxis',
  PHARMACY: 'healthcare.pharmacy',
  DENTIST: 'healthcare.dentist',
  PHYSIOTHERAPY: 'healthcare.physiotherapy',
  PSYCHOLOGY: 'healthcare.psychology',
  ALTERNATIVE_MEDICINE: 'healthcare.alternative',
  HEALTHCARE_GENERAL: 'healthcare'
}

// Education categories for special needs
export const EDUCATION_CATEGORIES = {
  SCHOOL: 'education.school',
  UNIVERSITY: 'education.university',
  KINDERGARTEN: 'education.kindergarten',
  LIBRARY: 'education.library',
  DRIVING_SCHOOL: 'education.driving_school'
}

// Community and support categories
export const COMMUNITY_CATEGORIES = {
  COMMUNITY_CENTER: 'building.community_center',
  SOCIAL_FACILITY: 'building.social_facility',
  GOVERNMENT: 'building.government',
  NGO: 'office.ngo'
}

/**
 * Search for Points of Interest using Geoapify Places API
 * Based on your exact code pattern:
 * fetch(`https://api.geoapify.com/v2/places?categories=healthcare.hospital&filter=circle:${lon},${lat},5000&limit=10&apiKey=${apiKey}`)
 */
export async function searchPOI(
  latitude: number,
  longitude: number,
  options: POISearchOptions = {}
): Promise<POIPlace[]> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured')
  }

  if (!latitude || !longitude) {
    throw new Error('Latitude and longitude are required')
  }

  try {
    const {
      categories = [HEALTHCARE_CATEGORIES.HOSPITAL],
      radius = 5000,
      limit = 10,
      filter = 'circle',
      countryCode
    } = options

    console.log('Searching POI:', { latitude, longitude, categories, radius, limit })

    // Your exact code pattern
    const lat = latitude
    const lon = longitude
    
    const params = new URLSearchParams({
      categories: categories.join(','),
      filter: `${filter}:${lon},${lat},${radius}`,
      limit: limit.toString(),
      apiKey: GEOAPIFY_API_KEY
    })

    // Add country filter if specified
    if (countryCode) {
      params.append('filter', `countrycode:${countryCode}`)
    }

    const url = `https://api.geoapify.com/v2/places?${params}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`POI search failed: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (!result.features || result.features.length === 0) {
      console.log('No POI found for the given criteria')
      return []
    }

    // Process results like your code
    const places: POIPlace[] = result.features.map((place: any) => {
      const coordinates = place.geometry.coordinates // [longitude, latitude]
      const properties = place.properties
      
      // Log like your example
      console.log(properties.name, coordinates)
      
      // Calculate distance from search center
      const distance = calculateDistance(latitude, longitude, coordinates[1], coordinates[0])
      
      return {
        id: place.properties.place_id || `poi-${Date.now()}-${Math.random()}`,
        name: properties.name || properties.formatted || 'Unknown Place',
        category: properties.categories?.[0] || 'unknown',
        subcategory: properties.categories?.[1],
        latitude: coordinates[1],
        longitude: coordinates[0],
        address: properties.address_line1 || properties.formatted || '',
        formatted: properties.formatted || properties.address_line1 || '',
        distance: Math.round(distance),
        phone: properties.contact?.phone,
        website: properties.contact?.website,
        opening_hours: properties.opening_hours,
        rating: properties.rating,
        wheelchair_accessible: properties.wheelchair === 'yes',
        properties: properties
      }
    })

    console.log(`Found ${places.length} POI places:`, places)
    return places

  } catch (error) {
    console.error('POI search error:', error)
    throw error
  }
}

/**
 * Search for healthcare facilities specifically
 */
export async function searchHealthcarePOI(
  latitude: number,
  longitude: number,
  radius: number = 5000,
  limit: number = 10
): Promise<POIPlace[]> {
  return searchPOI(latitude, longitude, {
    categories: [
      HEALTHCARE_CATEGORIES.HOSPITAL,
      HEALTHCARE_CATEGORIES.CLINIC,
      HEALTHCARE_CATEGORIES.PSYCHOLOGY,
      HEALTHCARE_CATEGORIES.HEALTHCARE_GENERAL
    ],
    radius,
    limit,
    countryCode: 'MY' // Focus on Malaysia
  })
}

/**
 * Search for autism-related facilities
 */
export async function searchAutismRelatedPOI(
  latitude: number,
  longitude: number,
  radius: number = 10000,
  limit: number = 20
): Promise<POIPlace[]> {
  const healthcarePlaces = await searchPOI(latitude, longitude, {
    categories: [
      HEALTHCARE_CATEGORIES.PSYCHOLOGY,
      HEALTHCARE_CATEGORIES.CLINIC,
      HEALTHCARE_CATEGORIES.HOSPITAL,
      HEALTHCARE_CATEGORIES.ALTERNATIVE_MEDICINE
    ],
    radius,
    limit: Math.floor(limit * 0.6),
    countryCode: 'MY'
  })

  const educationPlaces = await searchPOI(latitude, longitude, {
    categories: [
      EDUCATION_CATEGORIES.SCHOOL,
      EDUCATION_CATEGORIES.KINDERGARTEN,
      EDUCATION_CATEGORIES.UNIVERSITY
    ],
    radius,
    limit: Math.floor(limit * 0.3),
    countryCode: 'MY'
  })

  const communityPlaces = await searchPOI(latitude, longitude, {
    categories: [
      COMMUNITY_CATEGORIES.COMMUNITY_CENTER,
      COMMUNITY_CATEGORIES.SOCIAL_FACILITY,
      COMMUNITY_CATEGORIES.NGO
    ],
    radius,
    limit: Math.floor(limit * 0.1),
    countryCode: 'MY'
  })

  // Combine and sort by distance
  const allPlaces = [...healthcarePlaces, ...educationPlaces, ...communityPlaces]
  return allPlaces.sort((a, b) => (a.distance || 0) - (b.distance || 0))
}

/**
 * Search for places by category with your exact pattern
 */
export async function searchPOIByCategory(
  latitude: number,
  longitude: number,
  category: string,
  radius: number = 5000,
  limit: number = 10
): Promise<POIPlace[]> {
  // Your exact code pattern
  const lat = latitude
  const lon = longitude
  
  try {
    const response = await fetch(
      `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lon},${lat},${radius}&limit=${limit}&apiKey=${GEOAPIFY_API_KEY}`
    )
    const result = await response.json()
    
    const places: POIPlace[] = []
    
    // Your exact forEach pattern
    result.features.forEach((place: any) => {
      console.log(place.properties.name, place.geometry.coordinates)
      
      const coordinates = place.geometry.coordinates
      const properties = place.properties
      const distance = calculateDistance(latitude, longitude, coordinates[1], coordinates[0])
      
      places.push({
        id: properties.place_id || `poi-${Date.now()}-${Math.random()}`,
        name: properties.name || 'Unknown Place',
        category: category,
        latitude: coordinates[1],
        longitude: coordinates[0],
        address: properties.formatted || '',
        formatted: properties.formatted || '',
        distance: Math.round(distance),
        properties: properties
      })
    })
    
    return places
    
  } catch (error) {
    console.error('POI category search error:', error)
    throw error
  }
}

/**
 * Get nearby places of multiple types
 */
export async function getNearbyPlaces(
  latitude: number,
  longitude: number,
  radius: number = 5000
): Promise<{ [category: string]: POIPlace[] }> {
  const results: { [category: string]: POIPlace[] } = {}
  
  const categories = [
    { name: 'Hospitals', category: HEALTHCARE_CATEGORIES.HOSPITAL },
    { name: 'Clinics', category: HEALTHCARE_CATEGORIES.CLINIC },
    { name: 'Psychology Centers', category: HEALTHCARE_CATEGORIES.PSYCHOLOGY },
    { name: 'Schools', category: EDUCATION_CATEGORIES.SCHOOL },
    { name: 'Community Centers', category: COMMUNITY_CATEGORIES.COMMUNITY_CENTER }
  ]
  
  for (const cat of categories) {
    try {
      const places = await searchPOIByCategory(latitude, longitude, cat.category, radius, 5)
      results[cat.name] = places
    } catch (error) {
      console.error(`Failed to search ${cat.name}:`, error)
      results[cat.name] = []
    }
  }
  
  return results
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  } else {
    return `${(meters / 1000).toFixed(1)}km`
  }
}

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string): string {
  const categoryMap: { [key: string]: string } = {
    'healthcare.hospital': 'Hospital',
    'healthcare.clinic_or_praxis': 'Clinic',
    'healthcare.psychology': 'Psychology Center',
    'healthcare.pharmacy': 'Pharmacy',
    'education.school': 'School',
    'education.university': 'University',
    'building.community_center': 'Community Center',
    'building.social_facility': 'Social Facility',
    'office.ngo': 'NGO'
  }
  
  return categoryMap[category] || category.split('.').pop()?.replace('_', ' ') || 'Unknown'
}
