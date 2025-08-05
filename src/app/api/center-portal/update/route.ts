import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    // Get session token from cookies (same as verify endpoint)
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('center_session_token')?.value

    // Debug logging
    console.log('Update API - Available cookies:', cookieStore.getAll().map(c => c.name))
    console.log('Update API - Session token found:', !!sessionToken)

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }

    // Use the same verification logic as the verify endpoint
    const { verifyCenterSession } = await import('@/lib/center-auth')
    const sessionResult = await verifyCenterSession(sessionToken)

    if (!sessionResult.valid || !sessionResult.user) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    const user = sessionResult.user

    // Parse request body
    const body = await request.json()
    const {
      centerName,
      contactPerson,
      email,
      phone,
      address,
      latitude,
      longitude,
      centerType,
      description,
      businessLicense
    } = body

    // Validate required fields
    if (!centerName || !contactPerson || !email || !phone || !address ||
        latitude === undefined || longitude === undefined || !centerType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90' },
        { status: 400 }
      )
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180' },
        { status: 400 }
      )
    }

    // Validate center type
    const validCenterTypes = ['diagnostic', 'therapy', 'support', 'education']
    if (!validCenterTypes.includes(centerType)) {
      return NextResponse.json(
        { error: 'Invalid center type' },
        { status: 400 }
      )
    }

    // Check if email is being changed and if it's already taken by another center
    if (email !== user.email) {
      const { data: existingUser, error: checkError } = await supabase
        .from('center_users')
        .select('id')
        .eq('email', email)
        .neq('id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking email:', checkError)
        return NextResponse.json(
          { error: 'Database error while checking email' },
          { status: 500 }
        )
      }

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already registered by another center' },
          { status: 409 }
        )
      }
    }

    // Update center user data (only fields that exist in center_users table)
    const { data: updatedUser, error: updateError } = await supabase
      .from('center_users')
      .update({
        center_name: centerName,
        contact_person: contactPerson,
        email: email,
        phone: phone,
        address: address,
        latitude: latitude,
        longitude: longitude,
        center_type: centerType,
        description: description || null,
        business_license: businessLicense || null,
        is_verified: user.is_verified || false,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating center user:', updateError)
      return NextResponse.json(
        { error: 'Failed to update center details' },
        { status: 500 }
      )
    }

    // Also update the corresponding autism_centers entry if it exists to prevent duplicates
    console.log('🔄 Checking for existing autism_centers entry to update...')

    const { data: existingAutismCenter, error: checkError } = await supabase
      .from('autism_centers')
      .select('id')
      .eq('center_user_id', user.id)
      .single()

    let autismCenterUpdated = false

    if (!checkError && existingAutismCenter) {
      console.log('📝 Updating existing autism_centers entry to prevent duplicates')

      const { error: autismCenterUpdateError } = await supabase
        .from('autism_centers')
        .update({
          name: centerName,
          type: centerType,
          address: address,
          latitude: latitude,
          longitude: longitude,
          phone: phone,
          email: email,
          description: description || null,
          contact_person: contactPerson,
          verified: user.is_verified || false,
          updated_at: new Date().toISOString()
        })
        .eq('center_user_id', user.id)

      if (autismCenterUpdateError) {
        console.error('⚠️ Warning: Failed to update autism_centers entry:', autismCenterUpdateError)
        // Don't fail the request, as center_users update was successful
      } else {
        autismCenterUpdated = true
        console.log('✅ Successfully updated autism_centers entry')
      }
    } else {
      console.log('📋 No existing autism_centers entry found (ID-based fetching will handle this)')
    }

    console.log('✅ Center details updated successfully in center_users table')
    console.log('📊 ID-based fetching will automatically sync this data to user and admin sites')

    return NextResponse.json({
      success: true,
      message: 'Center details updated successfully. Changes will automatically appear on user and admin sites via ID-based fetching.',
      user: updatedUser,
      sync_status: {
        center_users_updated: true,
        autism_centers_updated: autismCenterUpdated,
        id_based_sync_enabled: true,
        visible_to_users: true,
        visible_to_admin: true,
        duplicate_prevention: autismCenterUpdated ? 'Applied' : 'Not needed'
      }
    })

  } catch (error) {
    console.error('Update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
