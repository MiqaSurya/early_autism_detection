import { NextRequest, NextResponse } from 'next/server'
import { registerCenterUser } from '@/lib/center-auth'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('📝 Center registration request received:', {
      email: body.email,
      centerName: body.centerName,
      centerType: body.centerType,
      latitude: body.latitude,
      longitude: body.longitude,
      hasPassword: !!body.password
    })

    const {
      email,
      password,
      contactPerson,
      centerName,
      centerType,
      address,
      latitude,
      longitude,
      phone,
      description,
      businessLicense
    } = body

    // Validate required fields
    if (!email || !password || !contactPerson || !centerName || !centerType || !address || latitude === undefined || longitude === undefined) {
      console.error('❌ Missing required fields:', {
        email: !!email,
        password: !!password,
        contactPerson: !!contactPerson,
        centerName: !!centerName,
        centerType: !!centerType,
        address: !!address,
        latitude: latitude !== undefined,
        longitude: longitude !== undefined
      })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate latitude and longitude
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
      console.error('❌ Invalid coordinates:', {
        latitude: { value: latitude, type: typeof latitude, isNaN: isNaN(latitude) },
        longitude: { value: longitude, type: typeof longitude, isNaN: isNaN(longitude) }
      })
      return NextResponse.json(
        { error: 'Latitude and longitude must be valid numbers' },
        { status: 400 }
      )
    }

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate center type
    const validTypes = ['diagnostic', 'therapy', 'support', 'education']
    if (!validTypes.includes(centerType)) {
      return NextResponse.json(
        { error: 'Invalid center type' },
        { status: 400 }
      )
    }

    // Register the center user
    console.log('🔄 Attempting to register center user...')
    const result = await registerCenterUser({
      email,
      password,
      contactPerson,
      centerName,
      centerType,
      address,
      latitude,
      longitude,
      phone,
      description,
      businessLicense
    })

    if (!result.success) {
      console.error('❌ Center user registration failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Registration failed' },
        { status: 400 }
      )
    }

    console.log('✅ Center user registered successfully:', result.user?.id)

    // Manual sync to autism_centers using service role (bypasses RLS)
    if (result.user) {
      try {
        console.log('🔄 Syncing to autism_centers table...')

        // Check environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
          console.error('❌ Missing Supabase environment variables')
          throw new Error('Database configuration error')
        }

        // Create service role client for autism_centers insertion
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )

        // Helper function to get default services based on center type
        const getDefaultServices = (type: string) => {
          switch (type) {
            case 'diagnostic': return ['ADOS-2 Assessment', 'Developmental Evaluation', 'Speech Assessment']
            case 'therapy': return ['ABA Therapy', 'Speech Therapy', 'Occupational Therapy']
            case 'support': return ['Support Groups', 'Family Counseling', 'Resource Navigation']
            case 'education': return ['Inclusive Classrooms', 'Teacher Training', 'Parent Education']
            default: return ['General Autism Support Services']
          }
        }

        // Insert into autism_centers for ID-based fetching sync
        const { error: syncError } = await supabaseAdmin
          .from('autism_centers')
          .insert({
            center_user_id: result.user.id,
            name: result.user.center_name,
            type: result.user.center_type,
            address: result.user.address,
            latitude: result.user.latitude,
            longitude: result.user.longitude,
            phone: result.user.phone,
            email: result.user.email,
            description: result.user.description,
            contact_person: result.user.contact_person,
            services: getDefaultServices(result.user.center_type),
            age_groups: ['0-3', '4-7', '8-12', '13-18'],
            insurance_accepted: ['Private Pay', 'Insurance', 'Medicaid'],
            verified: false, // New centers start unverified
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (syncError) {
          console.error('❌ Autism centers sync error:', syncError)
          // Don't fail the registration if sync fails, just log it
        } else {
          console.log('✅ Successfully synced to autism_centers table')
        }
      } catch (syncError) {
        console.error('❌ Autism centers sync error:', syncError)
        // Don't fail the registration if sync fails, just log it
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Center registered successfully',
      user: {
        id: result.user?.id,
        email: result.user?.email,
        center_name: result.user?.center_name,
        contact_person: result.user?.contact_person
      }
    })

  } catch (error) {
    console.error('Center registration API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
