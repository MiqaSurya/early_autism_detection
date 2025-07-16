import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

// Simple in-memory cache to reduce egress
let centersCache: any = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

// GET nearby autism centers
export async function GET(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
  const { searchParams } = new URL(request.url)
  
  // Get query parameters
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  const radius = parseFloat(searchParams.get('radius') || '25') // Default 25km radius
  const type = searchParams.get('type') // Optional filter by type
  const limit = parseInt(searchParams.get('limit') || '20') // Default 20 results
  const forceRefresh = searchParams.get('_refresh') === 'true'
  const timestamp = searchParams.get('_t')

  // Force refresh logging disabled to reduce terminal spam
  // if (forceRefresh) {
  //   console.log('🔄 Force refresh API call:', { lat, lng, radius, type })
  // }
  
  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
  }
  
  try {
    // Check cache first (unless force refresh) - REDUCES EGRESS!
    const now = Date.now()
    if (!forceRefresh && centersCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('📦 Returning cached data (reducing egress)')

      // Apply filters to cached data
      let filteredCenters = centersCache

      if (type && ['diagnostic', 'therapy', 'support', 'education'].includes(type)) {
        filteredCenters = centersCache.filter((center: any) => center.type === type)
      }

      // Apply distance filtering
      filteredCenters = filteredCenters
        .map((center: any) => ({
          ...center,
          distance: calculateDistance(lat, lng, center.latitude, center.longitude)
        }))
        .filter((center: any) => center.distance <= radius)
        .sort((a: any, b: any) => a.distance - b.distance)
        .slice(0, limit)

      return NextResponse.json({
        centers: filteredCenters,
        cached: true,
        timestamp: new Date().toISOString()
      })
    }

    // Fetch from both center_users (real-time) and autism_centers (existing centers)

    // 1. Fetch ESSENTIAL data only from center_users (reduce egress)
    // This ensures ANY new center registration will automatically appear in user locator
    let centerUsersQuery = supabase
      .from('center_users')
      .select(`
        id,
        center_name,
        center_type,
        address,
        latitude,
        longitude,
        phone,
        email,
        contact_person,
        is_verified,
        updated_at
      `)
      .eq('is_active', true) // Only active centers - this includes ALL new registrations

    // Add type filter for center_users if specified
    if (type && ['diagnostic', 'therapy', 'support', 'education'].includes(type)) {
      centerUsersQuery = centerUsersQuery.eq('center_type', type)
    }

    // 2. Fetch ESSENTIAL data only from autism_centers (reduce egress)
    let autismCentersQuery = supabase
      .from('autism_centers')
      .select(`
        id,
        name,
        type,
        address,
        latitude,
        longitude,
        phone,
        email,
        contact_person,
        is_verified,
        updated_at
      `)
      .is('center_user_id', null) // Only get centers that are NOT linked to center_users

    // Add type filter for autism_centers if specified
    if (type && ['diagnostic', 'therapy', 'support', 'education'].includes(type)) {
      autismCentersQuery = autismCentersQuery.eq('type', type)
    }

    // Execute both queries
    const [centerUsersResult, autismCentersResult] = await Promise.all([
      centerUsersQuery.order('updated_at', { ascending: false }),
      autismCentersQuery.order('updated_at', { ascending: false })
    ])

    if (centerUsersResult.error) {
      console.error('Center users database error:', centerUsersResult.error)
      return NextResponse.json({ error: centerUsersResult.error.message }, { status: 500 })
    }

    if (autismCentersResult.error) {
      console.error('Autism centers database error:', autismCentersResult.error)
      return NextResponse.json({ error: autismCentersResult.error.message }, { status: 500 })
    }

    const centerUsers = centerUsersResult.data || []
    const autismCenters = autismCentersResult.data || []

    console.log(`📊 Found ${centerUsers.length} centers from center_users (real-time, ID-based) + ${autismCenters.length} centers from autism_centers`)
    console.log(`🔄 ALL new center registrations automatically included via ID-based fetching from center_users`)

    // Transform center_users data to match expected autism_centers format
    // This includes ALL centers registered through center portal - new registrations appear instantly
    const transformedCenterUsers = centerUsers.map(centerUser => ({
      id: centerUser.id,
      center_user_id: centerUser.id, // For compatibility
      name: centerUser.center_name,
      type: centerUser.center_type,
      address: centerUser.address,
      latitude: centerUser.latitude,
      longitude: centerUser.longitude,
      phone: centerUser.phone,
      email: centerUser.email,
      description: (centerUser as any).description || '',
      contact_person: centerUser.contact_person,
      verified: centerUser.is_verified || false,
      created_at: (centerUser as any).created_at || new Date().toISOString(),
      updated_at: centerUser.updated_at,
      // Default values for fields that don't exist in center_users
      services: getDefaultServices(centerUser.center_type),
      age_groups: ['0-3', '4-7', '8-12', '13-18'],
      insurance_accepted: ['Private Pay', 'Insurance', 'Medicaid'],
      rating: null,
      website: null,
      source: 'center_users' // Track source for debugging
    }))

    // Add source tracking to autism_centers data
    const autismCentersWithSource = autismCenters.map(center => ({
      ...center,
      source: 'autism_centers' // Track source for debugging
    }))

    // Combine both sources
    const allCenters = [...transformedCenterUsers, ...autismCentersWithSource]

    // Apply limit after combining (to respect the original limit parameter)
    const limitedCenters = allCenters.slice(0, limit)

    console.log(`📊 Combined total: ${allCenters.length} centers (limited to ${limitedCenters.length})`)

    // Calculate distances and sort by proximity
    const centersWithDistance = limitedCenters.map(center => {
      const distance = calculateDistance(lat, lng, center.latitude, center.longitude)
      return {
        ...center,
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      }
    }).filter(center => center.distance <= radius) // Filter by radius
      .sort((a, b) => a.distance - b.distance) // Sort by distance

    // Store in cache to reduce future egress
    centersCache = allCenters // Cache the raw data before filtering
    cacheTimestamp = Date.now()
    console.log(`💾 Cached ${allCenters.length} centers for 5 minutes`)

    // Only log results for force refresh in development
    if (process.env.NODE_ENV === 'development' && forceRefresh) {
      console.log(`📍 Found ${centersWithDistance?.length || 0} centers within ${radius}km`)
    }

    // Return response
    const response = NextResponse.json({
      centers: centersWithDistance || [],
      cached: false,
      timestamp: new Date().toISOString()
    })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')

    // Add additional headers for force refresh tracking
    if (forceRefresh) {
      response.headers.set('X-Force-Refresh', 'true')
      response.headers.set('X-Refresh-Timestamp', timestamp || Date.now().toString())
    }
    response.headers.set('X-Data-Timestamp', new Date().toISOString())

    return response
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in kilometers
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Helper function to get default services based on center type
function getDefaultServices(centerType: string): string[] {
  switch (centerType) {
    case 'diagnostic':
      return ['ADOS-2 Assessment', 'Developmental Evaluation', 'Speech Assessment', 'Psychological Testing']
    case 'therapy':
      return ['ABA Therapy', 'Speech Therapy', 'Occupational Therapy', 'Social Skills Training']
    case 'support':
      return ['Support Groups', 'Family Counseling', 'Resource Navigation', 'Respite Care']
    case 'education':
      return ['Inclusive Classrooms', 'Teacher Training', 'Curriculum Development', 'Parent Education']
    default:
      return ['Autism Assessment', 'Behavioral Therapy', 'Speech Therapy']
  }
}

// Helper function to check admin authentication
function isAdminRequest(request: Request): boolean {
  // For now, we'll allow admin operations without strict authentication
  // In a production environment, you'd want to implement proper admin session validation
  return true
}

// POST to add a new autism center (admin only)
export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Check admin authentication
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
  }
  
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['name', 'type', 'address', 'latitude', 'longitude']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }
    
    // Validate type
    if (!['diagnostic', 'therapy', 'support', 'education'].includes(body.type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
    
    // Insert new autism center
    const { data, error } = await supabase
      .from('autism_centers')
      .insert({
        name: body.name,
        type: body.type,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        phone: body.phone,
        website: body.website,
        email: body.email,
        description: body.description,
        services: body.services || [],
        age_groups: body.age_groups || [],
        insurance_accepted: body.insurance_accepted || [],
        rating: body.rating,
        verified: body.verified || false
      })
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update autism center
export async function PUT(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Check admin authentication
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 })
    }

    // Validate type if provided
    if (updateData.type && !['diagnostic', 'therapy', 'support', 'education'].includes(updateData.type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Update autism center
    const { data, error } = await supabase
      .from('autism_centers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Autism center not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete autism center
export async function DELETE(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Check admin authentication
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  try {
    // Delete autism center
    const { error } = await supabase
      .from('autism_centers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Autism center deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
