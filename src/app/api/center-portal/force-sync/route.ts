import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Get session token from cookies
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('center_session_token')?.value

    console.log('🔄 Force Sync API - Session token found:', !!sessionToken)

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
    console.log('🔄 Force Sync API - User verified:', user.center_name)
    console.log('📊 Force Sync API - User data:', {
      id: user.id,
      center_name: user.center_name,
      center_type: user.center_type,
      address: user.address,
      latitude: user.latitude,
      longitude: user.longitude,
      phone: user.phone,
      email: user.email,
      is_active: user.is_active,
      updated_at: user.updated_at
    })

    // Validate user data before proceeding
    if (!user.center_name || !user.center_type || !user.address) {
      console.error('❌ Force Sync API - Missing required user data')
      return NextResponse.json(
        { error: 'Missing required center information (name, type, or address)' },
        { status: 400 }
      )
    }

    if (!user.latitude || !user.longitude) {
      console.error('❌ Force Sync API - Missing coordinates')
      return NextResponse.json(
        { error: 'Missing coordinates - please update your center location' },
        { status: 400 }
      )
    }

    // Check if autism_centers record exists
    console.log('🔍 Force Sync API - Checking for existing autism_centers record...')
    const { data: existingCenter, error: fetchError } = await supabase
      .from('autism_centers')
      .select('*')
      .eq('center_user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching existing center:', fetchError)
      return NextResponse.json(
        { error: 'Failed to check existing center record' },
        { status: 500 }
      )
    }

    if (existingCenter) {
      console.log('✅ Force Sync API - Found existing autism_centers record:', existingCenter.id)
      console.log('📊 Force Sync API - Existing center data:', existingCenter)
    } else {
      console.log('ℹ️ Force Sync API - No existing autism_centers record found - will create new one')
    }

    // Generate default services based on center type
    const getDefaultServices = (type: string) => {
      switch (type) {
        case 'diagnostic':
          return ['ADOS-2 Assessment', 'Developmental Evaluation', 'Speech Assessment', 'Psychological Testing']
        case 'therapy':
          return ['ABA Therapy', 'Speech Therapy', 'Occupational Therapy', 'Social Skills Training']
        case 'support':
          return ['Support Groups', 'Family Counseling', 'Resource Navigation', 'Respite Care']
        case 'education':
          return ['Inclusive Classrooms', 'Teacher Training', 'Curriculum Development', 'Parent Education']
        default:
          return ['General Autism Support Services']
      }
    }

    const centerData = {
      name: user.center_name,
      type: user.center_type,
      address: user.address,
      latitude: user.latitude,
      longitude: user.longitude,
      phone: user.phone,
      email: user.email,
      description: user.description || null,
      contact_person: user.contact_person,
      updated_at: new Date().toISOString(),
      verified: existingCenter?.verified || user.is_verified || false,
      rating: existingCenter?.rating || null,
      services: existingCenter?.services || getDefaultServices(user.center_type),
      age_groups: existingCenter?.age_groups || ['0-3', '4-7', '8-12', '13-18'],
      insurance_accepted: existingCenter?.insurance_accepted || ['Private Pay', 'Insurance', 'Medicaid'],
      website: existingCenter?.website || null
    }

    let syncResult: any = null
    let operation = ''

    console.log('📊 Force Sync API - Center data to sync:', centerData)

    if (existingCenter) {
      // Update existing record
      console.log('🔄 Force Sync - Updating existing autism_centers record')
      console.log('📊 Force Sync - Data differences:')

      // Log what's changing
      Object.keys(centerData).forEach(key => {
        if (existingCenter[key] !== centerData[key]) {
          console.log(`  ${key}: "${existingCenter[key]}" → "${centerData[key]}"`)
        }
      })

      const { data: updateResult, error: updateError } = await supabase
        .from('autism_centers')
        .update(centerData)
        .eq('center_user_id', user.id)
        .select()

      if (updateError) {
        console.error('❌ Force Sync - Update error:', updateError)
        console.error('❌ Force Sync - Update error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        })
        return NextResponse.json(
          { error: `Failed to update autism_centers record: ${updateError.message}` },
          { status: 500 }
        )
      }

      syncResult = updateResult
      operation = 'updated'
      console.log('✅ Force Sync - Successfully updated autism_centers record')
      console.log('📊 Force Sync - Updated record:', updateResult)
    } else {
      // Create new record
      console.log('🆕 Force Sync - Creating new autism_centers record')
      const insertData = {
        center_user_id: user.id,
        ...centerData,
        created_at: new Date().toISOString()
      }
      console.log('📊 Force Sync - Insert data:', insertData)

      const { data: createResult, error: createError } = await supabase
        .from('autism_centers')
        .insert(insertData)
        .select()

      if (createError) {
        console.error('❌ Force Sync - Create error:', createError)
        console.error('❌ Force Sync - Create error details:', {
          message: createError.message,
          details: createError.details,
          hint: createError.hint,
          code: createError.code
        })
        return NextResponse.json(
          { error: `Failed to create autism_centers record: ${createError.message}` },
          { status: 500 }
        )
      }

      syncResult = createResult
      operation = 'created'
      console.log('✅ Force Sync - Successfully created autism_centers record')
      console.log('📊 Force Sync - Created record:', createResult)
    }

    return NextResponse.json({
      success: true,
      message: `Force sync completed - ${operation} autism_centers record`,
      operation: operation,
      center_name: user.center_name,
      center_id: user.id,
      autism_center_id: syncResult?.[0]?.id,
      sync_data: centerData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Force Sync API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed - use POST' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed - use POST' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed - use POST' },
    { status: 405 }
  )
}
