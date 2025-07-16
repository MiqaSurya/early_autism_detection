import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get session token from cookies
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('center_session_token')?.value

    console.log('🔍 Debug Sync API - Session token found:', !!sessionToken)

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }

    // Verify session
    const { verifyCenterSession } = await import('@/lib/center-auth')
    const sessionResult = await verifyCenterSession(sessionToken)

    if (!sessionResult.valid || !sessionResult.user) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    const user = sessionResult.user
    console.log('🔍 Debug Sync API - User verified:', user.center_name)

    // Get center_users data
    const { data: centerUser, error: centerUserError } = await supabase
      .from('center_users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (centerUserError) {
      console.error('❌ Error fetching center_users data:', centerUserError)
      return NextResponse.json(
        { error: 'Failed to fetch center_users data' },
        { status: 500 }
      )
    }

    // Get autism_centers data
    const { data: autismCenter, error: autismCenterError } = await supabase
      .from('autism_centers')
      .select('*')
      .eq('center_user_id', user.id)
      .single()

    if (autismCenterError && autismCenterError.code !== 'PGRST116') {
      console.error('❌ Error fetching autism_centers data:', autismCenterError)
    }

    // Analyze sync status
    const syncAnalysis = {
      has_autism_centers_record: !!autismCenter,
      sync_status: 'unknown',
      issues: [],
      data_differences: {},
      last_updates: {
        center_users: centerUser?.updated_at,
        autism_centers: autismCenter?.updated_at
      }
    }

    // Check for issues
    if (!centerUser.center_name) syncAnalysis.issues.push('Missing center_name')
    if (!centerUser.center_type) syncAnalysis.issues.push('Missing center_type')
    if (!centerUser.address) syncAnalysis.issues.push('Missing address')
    if (!centerUser.latitude) syncAnalysis.issues.push('Missing latitude')
    if (!centerUser.longitude) syncAnalysis.issues.push('Missing longitude')
    if (!centerUser.email) syncAnalysis.issues.push('Missing email')
    if (!centerUser.contact_person) syncAnalysis.issues.push('Missing contact_person')
    if (!centerUser.is_active) syncAnalysis.issues.push('Center is inactive')

    if (centerUser.latitude === 0 && centerUser.longitude === 0) {
      syncAnalysis.issues.push('Default coordinates (0,0)')
    }

    // Compare data if autism_centers record exists
    if (autismCenter) {
      const fieldsToCompare = [
        { cu: 'center_name', ac: 'name' },
        { cu: 'center_type', ac: 'type' },
        { cu: 'address', ac: 'address' },
        { cu: 'latitude', ac: 'latitude' },
        { cu: 'longitude', ac: 'longitude' },
        { cu: 'phone', ac: 'phone' },
        { cu: 'email', ac: 'email' },
        { cu: 'description', ac: 'description' },
        { cu: 'contact_person', ac: 'contact_person' }
      ]

      fieldsToCompare.forEach(field => {
        const cuValue = centerUser[field.cu]
        const acValue = autismCenter[field.ac]
        
        if (cuValue !== acValue) {
          syncAnalysis.data_differences[field.ac] = {
            center_users: cuValue,
            autism_centers: acValue
          }
        }
      })

      // Determine sync status
      if (Object.keys(syncAnalysis.data_differences).length === 0) {
        syncAnalysis.sync_status = 'perfectly_synced'
      } else {
        syncAnalysis.sync_status = 'out_of_sync'
      }

      // Check timestamps
      const cuTime = new Date(centerUser.updated_at).getTime()
      const acTime = new Date(autismCenter.updated_at).getTime()
      
      if (cuTime > acTime) {
        syncAnalysis.sync_status = 'autism_centers_outdated'
      } else if (acTime > cuTime) {
        syncAnalysis.sync_status = 'autism_centers_newer'
      }
    } else {
      syncAnalysis.sync_status = 'no_autism_centers_record'
    }

    return NextResponse.json({
      success: true,
      center_name: centerUser.center_name,
      center_id: centerUser.id,
      sync_analysis: syncAnalysis,
      center_users_data: centerUser,
      autism_centers_data: autismCenter,
      recommendations: generateRecommendations(syncAnalysis),
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Debug Sync API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateRecommendations(analysis: any): string[] {
  const recommendations = []

  if (analysis.issues.length > 0) {
    recommendations.push(`Fix these issues first: ${analysis.issues.join(', ')}`)
  }

  if (analysis.sync_status === 'no_autism_centers_record') {
    recommendations.push('Click "Force Sync" to create autism_centers record')
  } else if (analysis.sync_status === 'out_of_sync' || analysis.sync_status === 'autism_centers_outdated') {
    recommendations.push('Click "Force Sync" to update autism_centers record')
  } else if (analysis.sync_status === 'perfectly_synced') {
    recommendations.push('Data is perfectly synced - no action needed')
  }

  if (Object.keys(analysis.data_differences).length > 0) {
    recommendations.push(`These fields are different: ${Object.keys(analysis.data_differences).join(', ')}`)
  }

  return recommendations
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed - use GET' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed - use GET' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed - use GET' },
    { status: 405 }
  )
}
