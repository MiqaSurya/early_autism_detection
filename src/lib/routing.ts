const GEOAPIFY_API_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY

export interface RoutePoint {
  latitude: number
  longitude: number
}

export interface RouteStep {
  instruction: string
  distance: number // in meters
  duration: number // in seconds
  maneuver: string
  coordinates: [number, number][] // [longitude, latitude] pairs
}

export interface RouteResult {
  coordinates: [number, number][] // [longitude, latitude] pairs - your exact format
  steps: RouteStep[]
  totalDistance: number // in meters
  totalDuration: number // in seconds
  summary: string
  mode: 'drive' | 'walk' | 'bicycle'
  properties: any // Raw properties from API
}

export interface RoutingOptions {
  mode?: 'drive' | 'walk' | 'bicycle'
  avoid?: string[] // 'tolls', 'highways', 'ferries'
  details?: string[] // 'instruction', 'elevation'
  units?: 'metric' | 'imperial'
}

/**
 * Calculate route using Geoapify Routing API
 * Based on your exact code pattern:
 * fetch(`https://api.geoapify.com/v1/routing?waypoints=${start[1]},${start[0]}|${end[1]},${end[0]}&mode=drive&apiKey=${apiKey}`)
 */
export async function calculateRoute(
  start: RoutePoint,
  end: RoutePoint,
  options: RoutingOptions = {}
): Promise<RouteResult | null> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured')
  }

  if (!start.latitude || !start.longitude || !end.latitude || !end.longitude) {
    throw new Error('Start and end coordinates are required')
  }

  try {
    const {
      mode = 'drive',
      avoid = [],
      details = ['instruction'],
      units = 'metric'
    } = options

    console.log('Calculating route:', { start, end, mode })

    // Your exact code pattern
    const startCoords = [start.longitude, start.latitude] // [lon, lat]
    const endCoords = [end.longitude, end.latitude] // [lon, lat]
    
    const params = new URLSearchParams({
      waypoints: `${start.latitude},${start.longitude}|${end.latitude},${end.longitude}`,
      mode: mode,
      apiKey: GEOAPIFY_API_KEY
    })

    // Add optional parameters
    if (avoid.length > 0) {
      params.append('avoid', avoid.join(','))
    }
    if (details.length > 0) {
      params.append('details', details.join(','))
    }
    if (units) {
      params.append('units', units)
    }

    const url = `https://api.geoapify.com/v1/routing?${params}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Routing failed: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (!result.features || result.features.length === 0) {
      console.log('No route found')
      return null
    }

    const feature = result.features[0]
    const geometry = feature.geometry
    const properties = feature.properties

    // Your exact result access
    const coordinates = geometry.coordinates
    console.log("Route:", coordinates) // Array of [lon, lat] points

    // Process route steps
    const steps: RouteStep[] = []
    if (properties.legs && properties.legs[0] && properties.legs[0].steps) {
      properties.legs[0].steps.forEach((step: any, index: number) => {
        steps.push({
          instruction: step.instruction?.text || `Step ${index + 1}`,
          distance: step.distance || 0,
          duration: step.duration || 0,
          maneuver: step.maneuver?.type || 'continue',
          coordinates: step.geometry?.coordinates || []
        })
      })
    }

    const routeResult: RouteResult = {
      coordinates: coordinates, // Your exact format: [longitude, latitude] pairs
      steps: steps,
      totalDistance: properties.distance || 0,
      totalDuration: properties.time || 0,
      summary: `${(properties.distance / 1000).toFixed(1)} km • ${Math.round(properties.time / 60)} min`,
      mode: mode,
      properties: properties
    }

    console.log('Route calculated:', routeResult)
    return routeResult

  } catch (error) {
    console.error('Routing error:', error)
    throw error
  }
}

/**
 * Calculate route with your exact code pattern
 */
export async function calculateRouteExact(
  start: [number, number], // [longitude, latitude]
  end: [number, number]    // [longitude, latitude]
): Promise<[number, number][] | null> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured')
  }

  try {
    // Your exact code pattern
    const response = await fetch(
      `https://api.geoapify.com/v1/routing?waypoints=${start[1]},${start[0]}|${end[1]},${end[0]}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`
    )
    const result = await response.json()
    
    // Your exact result access
    const coordinates = result.features[0].geometry.coordinates
    console.log("Route:", coordinates) // Array of [lon, lat] points
    
    return coordinates
    
  } catch (error) {
    console.error('Exact routing error:', error)
    return null
  }
}

/**
 * Calculate multiple routes with different modes
 */
export async function calculateMultipleRoutes(
  start: RoutePoint,
  end: RoutePoint,
  modes: ('drive' | 'walk' | 'bicycle')[] = ['drive', 'walk']
): Promise<{ [mode: string]: RouteResult | null }> {
  const results: { [mode: string]: RouteResult | null } = {}
  
  for (const mode of modes) {
    try {
      const route = await calculateRoute(start, end, { mode })
      results[mode] = route
    } catch (error) {
      console.error(`Failed to calculate ${mode} route:`, error)
      results[mode] = null
    }
  }
  
  return results
}

/**
 * Calculate route with waypoints (multiple stops)
 */
export async function calculateRouteWithWaypoints(
  waypoints: RoutePoint[],
  options: RoutingOptions = {}
): Promise<RouteResult | null> {
  if (!GEOAPIFY_API_KEY) {
    throw new Error('Geoapify API key is not configured')
  }

  if (waypoints.length < 2) {
    throw new Error('At least 2 waypoints are required')
  }

  try {
    const { mode = 'drive' } = options

    // Build waypoints string
    const waypointsStr = waypoints
      .map(point => `${point.latitude},${point.longitude}`)
      .join('|')

    const params = new URLSearchParams({
      waypoints: waypointsStr,
      mode: mode,
      apiKey: GEOAPIFY_API_KEY
    })

    const url = `https://api.geoapify.com/v1/routing?${params}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Multi-waypoint routing failed: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (!result.features || result.features.length === 0) {
      return null
    }

    const feature = result.features[0]
    const properties = feature.properties

    return {
      coordinates: feature.geometry.coordinates,
      steps: [], // Would need to process all legs
      totalDistance: properties.distance || 0,
      totalDuration: properties.time || 0,
      summary: `${(properties.distance / 1000).toFixed(1)} km • ${Math.round(properties.time / 60)} min`,
      mode: mode,
      properties: properties
    }

  } catch (error) {
    console.error('Multi-waypoint routing error:', error)
    throw error
  }
}

/**
 * Get route alternatives
 */
export async function getRouteAlternatives(
  start: RoutePoint,
  end: RoutePoint,
  mode: 'drive' | 'walk' | 'bicycle' = 'drive'
): Promise<RouteResult[]> {
  const alternatives: RouteResult[] = []
  
  // Try different routing options for alternatives
  const routingOptions = [
    { mode, avoid: [] },
    { mode, avoid: ['tolls'] },
    { mode, avoid: ['highways'] },
    { mode, avoid: ['tolls', 'highways'] }
  ]
  
  for (const options of routingOptions) {
    try {
      const route = await calculateRoute(start, end, options)
      if (route && !alternatives.some(alt => 
        Math.abs(alt.totalDistance - route.totalDistance) < 100 &&
        Math.abs(alt.totalDuration - route.totalDuration) < 60
      )) {
        alternatives.push(route)
      }
    } catch (error) {
      console.log('Alternative route failed:', options, error)
    }
  }
  
  return alternatives
}

/**
 * Format route duration for display
 */
export function formatRouteDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  } else if (seconds < 3600) {
    return `${Math.round(seconds / 60)}min`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.round((seconds % 3600) / 60)
    return `${hours}h ${minutes}min`
  }
}

/**
 * Format route distance for display
 */
export function formatRouteDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  } else {
    return `${(meters / 1000).toFixed(1)}km`
  }
}

/**
 * Calculate estimated arrival time
 */
export function getEstimatedArrival(durationSeconds: number): string {
  const now = new Date()
  const arrival = new Date(now.getTime() + durationSeconds * 1000)
  return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Check if coordinates are valid for routing
 */
export function validateRouteCoordinates(point: RoutePoint): boolean {
  return point.latitude >= -90 && 
         point.latitude <= 90 && 
         point.longitude >= -180 && 
         point.longitude <= 180 &&
         !isNaN(point.latitude) && 
         !isNaN(point.longitude)
}
