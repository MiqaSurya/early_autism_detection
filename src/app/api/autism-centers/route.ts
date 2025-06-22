import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET nearby autism centers
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  
  // Get query parameters
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  const radius = parseFloat(searchParams.get('radius') || '25') // Default 25km radius
  const type = searchParams.get('type') // Optional filter by type
  const limit = parseInt(searchParams.get('limit') || '20') // Default 20 results
  
  if (!lat || !lng) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
  }
  
  try {
    // Build the query
    let query = supabase
      .from('autism_centers')
      .select('*')
    
    // Add type filter if specified
    if (type && ['diagnostic', 'therapy', 'support', 'education'].includes(type)) {
      query = query.eq('type', type)
    }
    
    // Execute query
    const { data, error } = await query
      .limit(limit)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Calculate distances and sort by proximity
    const centersWithDistance = data?.map(center => {
      const distance = calculateDistance(lat, lng, center.latitude, center.longitude)
      return {
        ...center,
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      }
    }).filter(center => center.distance <= radius) // Filter by radius
      .sort((a, b) => a.distance - b.distance) // Sort by distance
    
    return NextResponse.json(centersWithDistance || [])
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

// POST to add a new autism center (admin only - you might want to add authentication)
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Check if user is authenticated (you might want to add admin role check)
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
