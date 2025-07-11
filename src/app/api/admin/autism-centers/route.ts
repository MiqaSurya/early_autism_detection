import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET - Get all autism centers for admin
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
    console.log('📋 Admin API: Getting all autism centers')

    const { data, error } = await supabase
      .from('autism_centers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ Admin API: Retrieved ${data?.length || 0} centers`)

    // Log first few center IDs for debugging
    if (data && data.length > 0) {
      const centerIds = data.slice(0, 5).map(center => ({ id: center.id, name: center.name }))
      console.log('📋 First 5 centers:', centerIds)
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('❌ Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new autism center (admin only)
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

    const { data, error } = await supabaseAdmin
      .from('autism_centers')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Admin API: Center created successfully')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update autism center (admin only)
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

    const { data, error } = await supabaseAdmin
      .from('autism_centers')
      .update(cleanUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Admin API: Center updated successfully')
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete autism center (admin only)
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

    // First check if the center exists
    const { data: existingCenter, error: checkError } = await supabaseAdmin
      .from('autism_centers')
      .select('id, name')
      .eq('id', id)
      .single()

    if (checkError) {
      console.error('❌ Error checking center existence:', checkError)
      return NextResponse.json({ error: 'Center not found' }, { status: 404 })
    }

    console.log('📋 Found center to delete:', existingCenter)

    // Now delete the center using admin client
    const { error, count } = await supabaseAdmin
      .from('autism_centers')
      .delete({ count: 'exact' })
      .eq('id', id)

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ Admin API: Center deleted successfully. Rows affected: ${count}`)

    if (count === 0) {
      console.warn('⚠️ No rows were deleted - center may not exist')
      return NextResponse.json({ error: 'Center not found or already deleted' }, { status: 404 })
    }

    return NextResponse.json({ success: true, deletedCount: count })
  } catch (error) {
    console.error('❌ Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
