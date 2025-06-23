// Built-in navigation service using Geoapify Routing API

const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

export interface RouteStep {
  instruction: string
  distance: number // in meters
  duration: number // in seconds
  maneuver: string
  coordinates: [number, number][]
  direction?: string
  street?: string
}

export interface NavigationRoute {
  steps: RouteStep[]
  totalDistance: number // in meters
  totalDuration: number // in seconds
  coordinates: [number, number][]
  summary: string
}

export interface NavigationResponse {
  routes: NavigationRoute[]
  waypoints: Array<{
    location: [number, number]
    name?: string
  }>
}

/**
 * Validate coordinates
 */
function isValidCoordinates(coord: { lat: number; lon: number }): boolean {
  return typeof coord.lat === 'number' &&
         typeof coord.lon === 'number' &&
         coord.lat >= -90 && coord.lat <= 90 &&
         coord.lon >= -180 && coord.lon <= 180 &&
         !isNaN(coord.lat) && !isNaN(coord.lon)
}

/**
 * Get turn-by-turn directions using Geoapify Routing API
 */
export async function getDirections(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
  mode: 'drive' | 'walk' | 'bicycle' = 'drive'
): Promise<NavigationRoute | null> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured')
  }

  // Validate input coordinates
  if (!isValidCoordinates(from)) {
    throw new Error(`Invalid 'from' coordinates: ${JSON.stringify(from)}`)
  }
  if (!isValidCoordinates(to)) {
    throw new Error(`Invalid 'to' coordinates: ${JSON.stringify(to)}`)
  }

  try {
    // Using your exact routing API pattern
    const url = `https://api.geoapify.com/v1/routing?waypoints=${from.lat},${from.lon}|${to.lat},${to.lon}&mode=${mode}&apiKey=${GEOAPIFY_API_KEY}`

    console.log('Navigation request:', { from, to, mode, url: url.replace(GEOAPIFY_API_KEY, 'API_KEY') })
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Routing failed: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.features || data.features.length === 0) {
      return null
    }

    const route = data.features[0]
    const properties = route.properties

    // Your exact result access pattern
    const coordinates = route.geometry?.coordinates
    console.log("Route:", coordinates) // Array of [lon, lat] points
    
    // Extract route steps
    const steps: RouteStep[] = properties.legs?.[0]?.steps?.map((step: any) => ({
      instruction: step.instruction?.text || 'Continue',
      distance: step.distance || 0,
      duration: step.time || 0,
      maneuver: step.instruction?.type || 'straight',
      coordinates: step.geometry?.coordinates || [],
      direction: step.instruction?.modifier,
      street: step.name
    })) || []

    return {
      steps,
      totalDistance: properties.distance || 0,
      totalDuration: properties.time || 0,
      coordinates: route.geometry?.coordinates || [],
      summary: `${formatDistance(properties.distance)} • ${formatDuration(properties.time)}`
    }
  } catch (error) {
    console.error('Navigation error:', error)
    throw error
  }
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  } else {
    return `${(meters / 1000).toFixed(1)} km`
  }
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

/**
 * Get maneuver icon for navigation instructions
 */
export function getManeuverIcon(maneuver: string, direction?: string): string {
  const icons: Record<string, string> = {
    'depart': '🚗',
    'arrive': '🏁',
    'straight': '⬆️',
    'turn': direction === 'left' ? '⬅️' : direction === 'right' ? '➡️' : '↗️',
    'sharp-turn': direction === 'left' ? '↖️' : direction === 'right' ? '↗️' : '↗️',
    'slight-turn': direction === 'left' ? '↖️' : direction === 'right' ? '↗️' : '↗️',
    'continue': '⬆️',
    'merge': '🔀',
    'on-ramp': '🛣️',
    'off-ramp': '🛤️',
    'fork': '🍴',
    'roundabout': '🔄',
    'rotary': '🔄',
    'roundabout-turn': '🔄',
    'notification': 'ℹ️',
    'new-name': '📍',
    'default': '➡️'
  }
  
  return icons[maneuver] || icons.default
}

/**
 * Calculate estimated arrival time
 */
export function getEstimatedArrival(durationSeconds: number): string {
  const now = new Date()
  const arrival = new Date(now.getTime() + durationSeconds * 1000)
  
  return arrival.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  })
}

/**
 * Get voice instruction for text-to-speech
 */
export function getVoiceInstruction(step: RouteStep): string {
  const distance = formatDistance(step.distance)
  let instruction = step.instruction
  
  // Clean up instruction for voice
  instruction = instruction.replace(/(<([^>]+)>)/gi, '') // Remove HTML tags
  instruction = instruction.replace(/\b(m|km|ft|mi)\b/g, '') // Remove distance units (we'll add our own)
  
  return `In ${distance}, ${instruction}`
}

/**
 * Check if user has deviated from route
 */
export function isOffRoute(
  userLocation: { lat: number; lon: number },
  routeCoordinates: [number, number][],
  thresholdMeters: number = 50
): boolean {
  if (!routeCoordinates.length) return false
  
  // Find closest point on route
  let minDistance = Infinity
  
  for (const coord of routeCoordinates) {
    const distance = calculateHaversineDistance(
      userLocation.lat,
      userLocation.lon,
      coord[1], // Geoapify uses [lon, lat] format
      coord[0]
    )
    
    if (distance * 1000 < minDistance) { // Convert km to meters
      minDistance = distance * 1000
    }
  }
  
  return minDistance > thresholdMeters
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateHaversineDistance(
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
 * Get current step based on user location
 */
export function getCurrentStep(
  userLocation: { lat: number; lon: number },
  route: NavigationRoute
): { stepIndex: number; step: RouteStep | null } {
  if (!route.steps.length) {
    return { stepIndex: -1, step: null }
  }
  
  // Simple implementation: find step with closest coordinates
  let closestStepIndex = 0
  let minDistance = Infinity
  
  route.steps.forEach((step, index) => {
    if (step.coordinates.length > 0) {
      const stepCoord = step.coordinates[0]
      const distance = calculateHaversineDistance(
        userLocation.lat,
        userLocation.lon,
        stepCoord[1], // Geoapify uses [lon, lat]
        stepCoord[0]
      )
      
      if (distance < minDistance) {
        minDistance = distance
        closestStepIndex = index
      }
    }
  })
  
  return {
    stepIndex: closestStepIndex,
    step: route.steps[closestStepIndex]
  }
}
