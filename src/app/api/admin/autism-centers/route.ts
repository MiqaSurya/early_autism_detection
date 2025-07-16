import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - Get all autism centers for admin (with ID-based fetching)
export async function GET(request: NextRequest) {
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

  try {
    console.log('📋 Admin API: Getting all autism centers with ID-based fetching')

    // First, get all existing centers from autism_centers table
    const { data: existingCenters, error: existingError } = await supabase
      .from('autism_centers')
      .select('*')
      .order('created_at', { ascending: false })

    if (existingError) {
      console.error('❌ Error fetching existing centers:', existingError)
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    console.log(`📋 Retrieved ${existingCenters?.length || 0} existing centers`)

    // Then, get all center registrations from center_users table
    const { data: centerUsers, error: centerUsersError } = await supabase
      .from('center_users')
      .select('*')
      .order('created_at', { ascending: false })

    if (centerUsersError) {
      console.error('❌ Error fetching center users:', centerUsersError)
      // Don't fail completely, just use existing centers
    }

    console.log(`📋 Retrieved ${centerUsers?.length || 0} center registrations`)

    // Convert center_users to autism_centers format
    const convertedCenters = (centerUsers || []).map(centerUser => ({
      id: centerUser.id,
      name: centerUser.center_name,
      type: centerUser.center_type,
      address: centerUser.address,
      latitude: centerUser.latitude,
      longitude: centerUser.longitude,
      phone: centerUser.phone,
      website: centerUser.website,
      email: centerUser.email,
      description: centerUser.description,
      services: centerUser.services || [],
      age_groups: centerUser.age_groups || [],
      insurance_accepted: centerUser.insurance_accepted || [],
      rating: centerUser.rating,
      verified: centerUser.verified || false,
      created_at: centerUser.created_at,
      updated_at: centerUser.updated_at
    }))

    // Combine both datasets, avoiding duplicates by ID
    const existingIds = new Set((existingCenters || []).map(center => center.id))
    const uniqueConvertedCenters = convertedCenters.filter(center => !existingIds.has(center.id))

    const allCenters = [...(existingCenters || []), ...uniqueConvertedCenters]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    console.log(`✅ Admin API: Combined ${allCenters.length} total centers (${existingCenters?.length || 0} existing + ${uniqueConvertedCenters.length} from registrations)`)

    // Log first few center IDs for debugging
    if (allCenters.length > 0) {
      const centerIds = allCenters.slice(0, 5).map(center => ({ id: center.id, name: center.name, source: existingIds.has(center.id) ? 'existing' : 'registration' }))
      console.log('📋 First 5 centers:', centerIds)
    }

    return NextResponse.json(allCenters)
  } catch (error) {
    console.error('❌ Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new autism center (admin only) - always creates in autism_centers table
export async function POST(request: NextRequest) {
  try {
    console.log('🆕 Admin API: Creating new autism center')
    const centerData = await request.json()

    // Use service role client for admin operations to bypass RLS
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

    const insertData = {
      name: centerData.name,
      type: centerData.type,
      address: centerData.address,
      latitude: centerData.latitude,
      longitude: centerData.longitude,
      phone: centerData.phone || null,
      website: centerData.website || null,
      email: centerData.email || null,
      description: centerData.description || null,
      services: centerData.services || [],
      age_groups: centerData.age_groups || [],
      insurance_accepted: centerData.insurance_accepted || [],
      rating: centerData.rating || null,
      verified: centerData.verified || false
    }

    console.log('📝 Admin API: Insert data:', insertData)

    // For admin-created centers, we'll always insert into the autism_centers table
    // Center registrations go into center_users table through a different flow
    const { data, error } = await supabaseAdmin
      .from('autism_centers')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Admin API: Center created successfully in autism_centers table')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update autism center (admin only) - handles both tables
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Admin API: Updating autism center')
    const centerData = await request.json()
    const { id, ...updateData } = centerData

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Use service role client for admin operations to bypass RLS
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

    // Clean up undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    )

    console.log('📝 Admin API: Update data:', cleanUpdateData)

    // First, try to update in autism_centers table
    const { data: autismCenterData, error: autismCenterError } = await supabaseAdmin
      .from('autism_centers')
      .update(cleanUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (!autismCenterError && autismCenterData) {
      console.log('✅ Admin API: Center updated successfully in autism_centers table')
      return NextResponse.json(autismCenterData)
    }

    // If not found in autism_centers, try center_users table
    console.log('📋 Center not found in autism_centers, trying center_users table')

    // Convert update data to center_users format
    const centerUserUpdateData: any = {}
    if (updateData.name) centerUserUpdateData.center_name = updateData.name
    if (updateData.type) centerUserUpdateData.center_type = updateData.type
    if (updateData.address) centerUserUpdateData.address = updateData.address
    if (updateData.latitude) centerUserUpdateData.latitude = updateData.latitude
    if (updateData.longitude) centerUserUpdateData.longitude = updateData.longitude
    if (updateData.phone) centerUserUpdateData.phone = updateData.phone
    if (updateData.website) centerUserUpdateData.website = updateData.website
    if (updateData.email) centerUserUpdateData.email = updateData.email
    if (updateData.description) centerUserUpdateData.description = updateData.description
    if (updateData.services) centerUserUpdateData.services = updateData.services
    if (updateData.age_groups) centerUserUpdateData.age_groups = updateData.age_groups
    if (updateData.insurance_accepted) centerUserUpdateData.insurance_accepted = updateData.insurance_accepted
    if (updateData.rating) centerUserUpdateData.rating = updateData.rating
    if (updateData.verified !== undefined) centerUserUpdateData.verified = updateData.verified

    const { data: centerUserData, error: centerUserError } = await supabaseAdmin
      .from('center_users')
      .update(centerUserUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (centerUserError) {
      console.error('❌ Database error in both tables:', { autismCenterError, centerUserError })
      return NextResponse.json({ error: 'Center not found in either table' }, { status: 404 })
    }

    // Convert back to autism_centers format for response
    const responseData = {
      id: centerUserData.id,
      name: centerUserData.center_name,
      type: centerUserData.center_type,
      address: centerUserData.address,
      latitude: centerUserData.latitude,
      longitude: centerUserData.longitude,
      phone: centerUserData.phone,
      website: centerUserData.website,
      email: centerUserData.email,
      description: centerUserData.description,
      services: centerUserData.services || [],
      age_groups: centerUserData.age_groups || [],
      insurance_accepted: centerUserData.insurance_accepted || [],
      rating: centerUserData.rating,
      verified: centerUserData.verified || false,
      created_at: centerUserData.created_at,
      updated_at: centerUserData.updated_at
    }

    console.log('✅ Admin API: Center updated successfully in center_users table')
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('❌ Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete autism center (admin only) - handles both tables
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Admin API: Deleting autism center')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    console.log('📝 Admin API: Deleting center with ID:', id)

    // Use service role client for admin operations to bypass RLS
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

    // First try to delete from autism_centers table
    const { data: existingCenter, error: checkError } = await supabaseAdmin
      .from('autism_centers')
      .select('id, name')
      .eq('id', id)
      .single()

    if (!checkError && existingCenter) {
      console.log('📋 Found center in autism_centers table:', existingCenter)

      // Delete from autism_centers table
      const { error: deleteError, count } = await supabaseAdmin
        .from('autism_centers')
        .delete({ count: 'exact' })
        .eq('id', id)

      if (deleteError) {
        console.error('❌ Database error:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      console.log(`✅ Admin API: Center deleted successfully from autism_centers. Rows affected: ${count}`)
      return NextResponse.json({ success: true, deletedCount: count, table: 'autism_centers' })
    }

    // If not found in autism_centers, try center_users table
    console.log('📋 Center not found in autism_centers, trying center_users table')

    const { data: centerUser, error: centerUserCheckError } = await supabaseAdmin
      .from('center_users')
      .select('id, center_name')
      .eq('id', id)
      .single()

    if (centerUserCheckError) {
      console.error('❌ Center not found in either table:', { checkError, centerUserCheckError })
      return NextResponse.json({ error: 'Center not found' }, { status: 404 })
    }

    console.log('📋 Found center in center_users table:', centerUser)

    // Delete from center_users table
    const { error: deleteError, count } = await supabaseAdmin
      .from('center_users')
      .delete({ count: 'exact' })
      .eq('id', id)

    if (deleteError) {
      console.error('❌ Database error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log(`✅ Admin API: Center deleted successfully from center_users. Rows affected: ${count}`)

    if (count === 0) {
      console.warn('⚠️ No rows were deleted - center may not exist')
      return NextResponse.json({ error: 'Center not found or already deleted' }, { status: 404 })
    }

    return NextResponse.json({ success: true, deletedCount: count, table: 'center_users' })
  } catch (error) {
    console.error('❌ Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
