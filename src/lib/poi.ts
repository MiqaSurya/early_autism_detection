const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

// Test function to verify API connectivity
export async function testGeoapifyAPI(): Promise<void> {
  console.log('🧪 Testing Geoapify API connectivity...')
  console.log('🔑 API Key:', GEOAPIFY_API_KEY ? `${GEOAPIFY_API_KEY.substring(0, 8)}...` : 'MISSING')

  if (!GEOAPIFY_API_KEY) {
    console.error('❌ Geoapify API key is not configured')
    return
  }

  try {
    // Test with a simple search around KL using supported category
    const testUrl = `https://api.geoapify.com/v2/places?categories=healthcare.hospital&filter=circle:101.6869,3.1390,5000&limit=5&apiKey=${GEOAPIFY_API_KEY}`
    console.log('🔍 Test URL:', testUrl)

    const response = await fetch(testUrl)
    console.log('📡 Test Response:', response.status, response.statusText)

    if (response.ok) {
      const data = await response.json()
      console.log('✅ API Test Success:', data)
    } else {
      const errorText = await response.text()
      console.error('❌ API Test Failed:', errorText)
    }
  } catch (error) {
    console.error('❌ API Test Error:', error)
  }
}

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

// Healthcare categories relevant to autism centers (using only supported categories)
export const HEALTHCARE_CATEGORIES = {
  HOSPITAL: 'healthcare.hospital',
  CLINIC: 'healthcare.clinic_or_praxis',
  PHARMACY: 'healthcare.pharmacy',
  DENTIST: 'healthcare.dentist',
  // Note: healthcare.psychology and healthcare.physiotherapy are not in the supported list
  // Using general healthcare category instead
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

// Community and support categories (using only supported categories)
export const COMMUNITY_CATEGORIES = {
  COMMUNITY_CENTER: 'activity.community_center',
  SOCIAL_FACILITY: 'service.social_facility',
  NGO: 'office.non_profit'
}

// Additional government and office categories that might have autism services
export const ADDITIONAL_CATEGORIES = {
  GOVERNMENT_HEALTHCARE: 'office.government.healthcare',
  GOVERNMENT_SOCIAL_SERVICES: 'office.government.social_services',
  EDUCATIONAL_INSTITUTION: 'office.educational_institution'
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
    
    // Use simple circle filter for now
    const filterString = `${filter}:${lon},${lat},${radius}`

    const params = new URLSearchParams({
      categories: categories.join(','),
      filter: filterString,
      limit: limit.toString(),
      apiKey: GEOAPIFY_API_KEY
    })

    // Add country filter as separate parameter if specified
    if (countryCode) {
      params.append('bias', `countrycode:${countryCode}`)
    }

    const url = `https://api.geoapify.com/v2/places?${params}`
    console.log('🔍 POI Search URL:', url)

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('POI API Error Response:', errorText)
      throw new Error(`POI search failed: ${response.status} ${response.statusText} - ${errorText}`)
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
      HEALTHCARE_CATEGORIES.HEALTHCARE_GENERAL
    ],
    radius,
    limit,
    countryCode: 'MY' // Focus on Malaysia
  })
}

/**
 * Search for autism-specific facilities only - Enhanced automatic search
 */
export async function searchAutismRelatedPOI(
  latitude: number,
  longitude: number,
  radius: number = 10000,
  limit: number = 20
): Promise<POIPlace[]> {
  try {
    console.log('🔍 Automatically searching for all autism centers and related facilities...')
    console.log(`📍 Search parameters: lat=${latitude}, lon=${longitude}, radius=${radius}m, limit=${limit}`)

    if (!GEOAPIFY_API_KEY) {
      console.error('❌ Geoapify API key is missing!')
      return []
    }

    // Search multiple categories to find autism centers - using only supported categories
    const searchPromises = [
      // General healthcare facilities (most comprehensive)
      searchPOIByCategory(latitude, longitude, HEALTHCARE_CATEGORIES.HEALTHCARE_GENERAL, radius, limit),
      // Clinics and medical practices
      searchPOIByCategory(latitude, longitude, HEALTHCARE_CATEGORIES.CLINIC, radius, limit),
      // Hospitals (may have autism departments)
      searchPOIByCategory(latitude, longitude, HEALTHCARE_CATEGORIES.HOSPITAL, radius, Math.floor(limit/2)),
      // Educational facilities (special needs schools)
      searchPOIByCategory(latitude, longitude, EDUCATION_CATEGORIES.SCHOOL, radius, Math.floor(limit/2)),
      // Community centers (may offer autism support)
      searchPOIByCategory(latitude, longitude, COMMUNITY_CATEGORIES.COMMUNITY_CENTER, radius, Math.floor(limit/3)),
      // Social facilities (may include autism support services)
      searchPOIByCategory(latitude, longitude, COMMUNITY_CATEGORIES.SOCIAL_FACILITY, radius, Math.floor(limit/4))
    ]

    // Execute all searches in parallel for faster results
    const results = await Promise.allSettled(searchPromises)

    // Combine all successful results
    let allPlaces: POIPlace[] = []
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const categoryName = ['Healthcare', 'Clinics', 'Hospitals', 'Schools', 'Community Centers', 'Social Facilities'][index]
        console.log(`✅ Found ${result.value.length} ${categoryName} facilities`)
        allPlaces = [...allPlaces, ...result.value]
      } else {
        console.log(`⚠️ Search failed for category ${index}:`, result.reason)
      }
    })

    console.log(`🔍 Total places found before filtering: ${allPlaces.length}`)
    console.log('🔍 All places found:', allPlaces.map(p => `${p.name} (${p.category})`))

    // Balanced autism-related filtering - include likely autism centers while excluding general medical
    const autismRelatedPlaces = allPlaces.filter(place => {
      const name = place.name.toLowerCase()
      const address = place.address.toLowerCase()
      const formatted = place.formatted.toLowerCase()
      const category = place.category.toLowerCase()

      // Direct autism-specific keywords
      const directAutismKeywords = [
        'autism', 'autistic', 'asd', 'asperger', 'aspergers'
      ]

      // Developmental and special needs keywords
      const developmentalKeywords = [
        'developmental', 'development', 'special needs', 'special education',
        'early intervention', 'early childhood', 'neurodevelopmental'
      ]

      // Therapy keywords that are often autism-related
      const therapyKeywords = [
        'behavioral', 'behaviour', 'speech therapy', 'occupational therapy',
        'speech pathology', 'ot therapy', 'behavioral intervention',
        'therapy center', 'therapy centre', 'rehabilitation'
      ]

      // Child-focused keywords
      const childKeywords = [
        'child', 'children', 'pediatric', 'paediatric', 'kids',
        'child development', 'child psychology', 'child psychiatry'
      ]

      // Psychology and medical keywords
      const psychologyKeywords = [
        'psychology', 'psychological', 'psychologist', 'psychiatry', 'psychiatric'
      ]

      // Support and educational keywords
      const supportKeywords = [
        'support', 'center', 'centre', 'clinic', 'learning disability',
        'learning difficulties', 'inclusive education', 'special education'
      ]

      // Check for direct autism terms (highest priority)
      const hasDirectAutism = directAutismKeywords.some(keyword =>
        name.includes(keyword) || address.includes(keyword) || formatted.includes(keyword)
      )

      // Check for developmental terms
      const hasDevelopmental = developmentalKeywords.some(keyword =>
        name.includes(keyword) || address.includes(keyword) || formatted.includes(keyword)
      )

      // Check for therapy terms
      const hasTherapy = therapyKeywords.some(keyword =>
        name.includes(keyword) || address.includes(keyword) || formatted.includes(keyword)
      )

      // Check for child-focused terms
      const hasChild = childKeywords.some(keyword =>
        name.includes(keyword) || address.includes(keyword) || formatted.includes(keyword)
      )

      // Check for psychology terms
      const hasPsychology = psychologyKeywords.some(keyword =>
        name.includes(keyword) || address.includes(keyword) || formatted.includes(keyword)
      )

      // Check for support terms
      const hasSupport = supportKeywords.some(keyword =>
        name.includes(keyword) || address.includes(keyword) || formatted.includes(keyword)
      )

      // Inclusion logic - more flexible but still targeted
      const isIncluded =
        hasDirectAutism || // Always include direct autism references
        (hasDevelopmental && (hasChild || hasTherapy || hasSupport)) || // Developmental + child/therapy/support
        (hasTherapy && hasChild) || // Therapy + child focus
        (hasPsychology && hasChild) || // Psychology + child focus
        (category.includes('psychology') && hasChild) || // Psychology category + child focus
        (hasChild && hasDevelopmental) // Child + developmental focus

      // Additional exclusions for clearly non-autism places
      const excludeKeywords = [
        'dental', 'dentist', 'pharmacy', 'hospital emergency', 'emergency room',
        'surgery', 'surgical', 'orthopedic', 'cardiology', 'oncology',
        'dermatology', 'ophthalmology', 'radiology', 'laboratory'
      ]

      const shouldExclude = excludeKeywords.some(keyword =>
        name.includes(keyword) || address.includes(keyword) || formatted.includes(keyword)
      )

      const finalDecision = isIncluded && !shouldExclude

      // Log what we're filtering for debugging
      if (finalDecision) {
        console.log(`✅ Including: ${place.name} (${place.category}) - Reasons: ${[
          hasDirectAutism && 'Direct autism',
          hasDevelopmental && 'Developmental',
          hasTherapy && 'Therapy',
          hasChild && 'Child-focused',
          hasPsychology && 'Psychology'
        ].filter(Boolean).join(', ')}`)
      } else {
        console.log(`❌ Excluding: ${place.name} (${place.category}) - Reason: ${
          shouldExclude ? 'Excluded category' : 'Not autism-related'
        }`)
      }

      return finalDecision
    })

    // Remove duplicates based on name and location proximity
    const uniquePlaces = removeDuplicatePlaces(autismRelatedPlaces)

    console.log(`✅ Automatically found ${uniquePlaces.length} autism-related facilities`)
    console.log('📍 Facilities found:', uniquePlaces.map(p => `${p.name} (${p.category})`))

    // Sort by distance for better user experience
    return uniquePlaces.sort((a, b) => (a.distance || 0) - (b.distance || 0))

  } catch (error) {
    console.error('❌ Automatic autism center search failed:', error)
    // Return empty array instead of throwing to allow fallback to database centers
    return []
  }
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
    if (!GEOAPIFY_API_KEY) {
      console.error(`❌ Geoapify API key missing for category: ${category}`)
      return []
    }

    const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lon},${lat},${radius}&limit=${limit}&apiKey=${GEOAPIFY_API_KEY}`
    console.log(`🔍 Searching ${category}:`, url)

    const response = await fetch(url)
    console.log(`📡 API Response for ${category}: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ POI Category API Error for ${category}:`, errorText)
      throw new Error(`POI category search failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log(`📊 Raw API result for ${category}:`, result)

    if (!result.features || result.features.length === 0) {
      console.log(`ℹ️ No ${category} places found in API response`)
      return []
    }

    console.log(`✅ Found ${result.features.length} ${category} places in API response`)

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

    console.log(`Found ${places.length} ${category} places`)
    return places

  } catch (error) {
    console.error('POI category search error:', error)
    // Return empty array instead of throwing to allow other searches to continue
    return []
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
    { name: 'Healthcare General', category: HEALTHCARE_CATEGORIES.HEALTHCARE_GENERAL },
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
 * Remove duplicate places based on name similarity and location proximity
 */
function removeDuplicatePlaces(places: POIPlace[]): POIPlace[] {
  const uniquePlaces: POIPlace[] = []

  for (const place of places) {
    const isDuplicate = uniquePlaces.some(existing => {
      // Check if names are similar (allowing for minor variations)
      const nameSimilar = place.name.toLowerCase().trim() === existing.name.toLowerCase().trim()

      // Check if locations are very close (within 100 meters)
      const distance = calculateDistance(place.latitude, place.longitude, existing.latitude, existing.longitude)
      const locationClose = distance < 100 // 100 meters

      return nameSimilar || locationClose
    })

    if (!isDuplicate) {
      uniquePlaces.push(place)
    }
  }

  return uniquePlaces
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
    'healthcare': 'Healthcare Facility',
    'healthcare.pharmacy': 'Pharmacy',
    'education.school': 'School',
    'education.university': 'University',
    'activity.community_center': 'Community Center',
    'service.social_facility': 'Social Facility',
    'office.non_profit': 'NGO',
    'office.government.healthcare': 'Government Healthcare',
    'office.government.social_services': 'Government Social Services',
    'office.educational_institution': 'Educational Institution'
  }
  
  return categoryMap[category] || category.split('.').pop()?.replace('_', ' ') || 'Unknown'
}
