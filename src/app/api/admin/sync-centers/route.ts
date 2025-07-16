import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin authentication check
function isAdminRequest(request: NextRequest): boolean {
  const adminSession = request.headers.get('x-admin-session')
  if (!adminSession) return false

  try {
    const session = JSON.parse(adminSession)
    
    // Verify admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin'
    
    // Check if session is valid and matches admin credentials
    const sessionAge = Date.now() - session.loginTime
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    
    return session.isAdmin === true && 
           session.email === adminEmail && 
           sessionAge < maxAge
  } catch (error) {
    console.error('Error parsing admin session:', error)
    return false
  }
}

// POST - Sync center data from center_users to autism_centers
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check admin authentication
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const { centerUserId, action = 'sync' } = body // action can be 'sync' or 'delete'

    // Use service role client for admin operations
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

    console.log(`🔄 Admin API: ${action} center data for center user:`, centerUserId)

    if (action === 'delete') {
      // Delete from autism_centers table
      const { error: deleteError } = await supabaseAdmin
        .from('autism_centers')
        .delete()
        .eq('center_user_id', centerUserId)

      if (deleteError) {
        console.error('❌ Error deleting from autism_centers:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      console.log('✅ Center deleted from autism_centers table')
      return NextResponse.json({
        success: true,
        message: 'Center removed from autism_centers table'
      })
    }

    // Fetch center user data
    const { data: centerUser, error: fetchError } = await supabaseAdmin
      .from('center_users')
      .select('*')
      .eq('id', centerUserId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching center user:', fetchError)
      return NextResponse.json({ error: 'Center user not found' }, { status: 404 })
    }

    // Check if center already exists in autism_centers
    const { data: existingCenter, error: checkError } = await supabaseAdmin
      .from('autism_centers')
      .select('id')
      .eq('center_user_id', centerUserId)
      .single()

    const centerData = {
      center_user_id: centerUser.id,
      name: centerUser.center_name,
      type: centerUser.center_type,
      address: centerUser.address,
      phone: centerUser.phone,
      email: centerUser.email,
      description: centerUser.description,
      contact_person: centerUser.contact_person,
      business_license: centerUser.business_license,
      is_verified: centerUser.is_verified,
      is_active: centerUser.is_active,
      updated_at: new Date().toISOString()
    }

    if (existingCenter && !checkError) {
      // Update existing center
      const { data: updatedCenter, error: updateError } = await supabaseAdmin
        .from('autism_centers')
        .update(centerData)
        .eq('center_user_id', centerUserId)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating autism_centers:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      console.log('✅ Center updated in autism_centers table:', updatedCenter.name)
      return NextResponse.json({
        success: true,
        message: 'Center updated in autism_centers table',
        data: updatedCenter
      })
    } else {
      // Create new center
      const { data: newCenter, error: insertError } = await supabaseAdmin
        .from('autism_centers')
        .insert([{
          ...centerData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) {
        console.error('❌ Error inserting into autism_centers:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      console.log('✅ Center created in autism_centers table:', newCenter.name)
      return NextResponse.json({
        success: true,
        message: 'Center created in autism_centers table',
        data: newCenter
      })
    }

  } catch (error) {
    console.error('❌ Admin sync centers API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Sync all centers from center_users to autism_centers
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check admin authentication
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    // Use service role client for admin operations
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

    console.log('🔄 Admin API: Syncing all centers from center_users to autism_centers')

    // Fetch all active center users
    const { data: centerUsers, error: fetchError } = await supabaseAdmin
      .from('center_users')
      .select('*')
      .eq('is_active', true)

    if (fetchError) {
      console.error('❌ Error fetching center users:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    let syncedCount = 0
    let updatedCount = 0
    let createdCount = 0
    const errors: string[] = []

    for (const centerUser of centerUsers || []) {
      try {
        // Check if center already exists in autism_centers
        const { data: existingCenter, error: checkError } = await supabaseAdmin
          .from('autism_centers')
          .select('id')
          .eq('center_user_id', centerUser.id)
          .single()

        const centerData = {
          center_user_id: centerUser.id,
          name: centerUser.center_name,
          type: centerUser.center_type,
          address: centerUser.address,
          phone: centerUser.phone,
          email: centerUser.email,
          description: centerUser.description,
          contact_person: centerUser.contact_person,
          business_license: centerUser.business_license,
          is_verified: centerUser.is_verified,
          is_active: centerUser.is_active,
          updated_at: new Date().toISOString()
        }

        if (existingCenter && !checkError) {
          // Update existing center
          const { error: updateError } = await supabaseAdmin
            .from('autism_centers')
            .update(centerData)
            .eq('center_user_id', centerUser.id)

          if (updateError) {
            errors.push(`Failed to update ${centerUser.center_name}: ${updateError.message}`)
          } else {
            updatedCount++
            syncedCount++
          }
        } else {
          // Create new center
          const { error: insertError } = await supabaseAdmin
            .from('autism_centers')
            .insert([{
              ...centerData,
              created_at: new Date().toISOString()
            }])

          if (insertError) {
            errors.push(`Failed to create ${centerUser.center_name}: ${insertError.message}`)
          } else {
            createdCount++
            syncedCount++
          }
        }
      } catch (error) {
        errors.push(`Error processing ${centerUser.center_name}: ${error}`)
      }
    }

    console.log(`✅ Sync completed: ${syncedCount} centers synced (${createdCount} created, ${updatedCount} updated)`)

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${syncedCount} centers synced`,
      stats: {
        total: centerUsers?.length || 0,
        synced: syncedCount,
        created: createdCount,
        updated: updatedCount,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ Admin sync all centers API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
