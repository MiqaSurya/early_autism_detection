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

// GET - Fetch all center users for admin management
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check admin authentication
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all' // all, verified, pending, inactive
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

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

    console.log('🔍 Admin API: Fetching center users with filters:', { page, limit, search, status, sortBy, sortOrder })

    // Build query
    let query = supabaseAdmin
      .from('center_users')
      .select(`
        id,
        email,
        contact_person,
        center_name,
        center_type,
        address,
        phone,
        description,
        business_license,
        is_verified,
        is_active,
        created_at,
        updated_at,
        last_login
      `)

    // Apply search filter
    if (search) {
      query = query.or(`center_name.ilike.%${search}%,contact_person.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply status filter
    if (status === 'verified') {
      query = query.eq('is_verified', true).eq('is_active', true)
    } else if (status === 'pending') {
      query = query.eq('is_verified', false).eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: centerUsers, error: centerUsersError, count } = await query

    if (centerUsersError) {
      console.error('❌ Center users fetch error:', centerUsersError)
      return NextResponse.json({ error: centerUsersError.message }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('center_users')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Count error:', countError)
    }

    // Calculate stats
    const { data: statsData, error: statsError } = await supabaseAdmin
      .from('center_users')
      .select('is_verified, is_active, created_at')

    let stats = {
      total: 0,
      verified: 0,
      pending: 0,
      inactive: 0,
      newThisMonth: 0
    }

    if (!statsError && statsData) {
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      stats = {
        total: statsData.length,
        verified: statsData.filter(c => c.is_verified && c.is_active).length,
        pending: statsData.filter(c => !c.is_verified && c.is_active).length,
        inactive: statsData.filter(c => !c.is_active).length,
        newThisMonth: statsData.filter(c => new Date(c.created_at) >= thisMonth).length
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        centerUsers: centerUsers || [],
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit)
        },
        stats,
        filters: {
          search,
          status,
          sortBy,
          sortOrder
        }
      }
    })

  } catch (error) {
    console.error('❌ Admin center users API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update center user
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Check admin authentication
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'Center user ID is required' }, { status: 400 })
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

    console.log('🔄 Admin API: Updating center user:', id)

    // Clean up undefined values and add updated_at
    const cleanUpdateData = {
      ...Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      ),
      updated_at: new Date().toISOString()
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('center_users')
      .update(cleanUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Center user update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log('✅ Center user updated successfully:', updatedUser.id)

    return NextResponse.json({
      success: true,
      message: 'Center user updated successfully',
      data: updatedUser
    })

  } catch (error) {
    console.error('❌ Admin center user update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete center user
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Check admin authentication
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Center user ID is required' }, { status: 400 })
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

    console.log('🗑️ Admin API: Deleting center user:', id)

    // First, get the center user details for logging
    const { data: centerUser, error: fetchError } = await supabaseAdmin
      .from('center_users')
      .select('center_name, contact_person, email')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('❌ Center user fetch error:', fetchError)
      return NextResponse.json({ error: 'Center user not found' }, { status: 404 })
    }

    // Delete the center user
    const { error: deleteError } = await supabaseAdmin
      .from('center_users')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('❌ Center user delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    console.log('✅ Center user deleted successfully:', centerUser.center_name)

    return NextResponse.json({
      success: true,
      message: `Center user "${centerUser.center_name}" deleted successfully`,
      deletedUser: centerUser
    })

  } catch (error) {
    console.error('❌ Admin center user delete API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
