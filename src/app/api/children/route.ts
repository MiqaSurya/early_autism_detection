import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// GET all children for the authenticated user
export async function GET(request: Request) {
  try {
    console.log('🔍 Children API GET called')

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

    console.log('✅ Supabase client created')

    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔐 Session check:', { hasSession: !!session, sessionError: sessionError?.message })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all children for the authenticated user
    const { data: children, error } = await supabase
      .from('children')
      .select('id, parent_id, name, date_of_birth, gender, additional_notes, created_at, updated_at')
      .eq('parent_id', session.user.id)
      .order('created_at', { ascending: false })

    console.log('📊 Database query result:', { childrenCount: children?.length, error: error?.message })

    if (error) {
      console.error('❌ Error fetching children:', error)
      return NextResponse.json({
        error: `Failed to fetch children: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json(children || [])

  } catch (error) {
    console.error('❌ Error in children GET API:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch children'
    }, { status: 500 })
  }
}

// POST to create a new child profile
export async function POST(request: Request) {
  try {
    console.log('🆕 Children API POST called')

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

    console.log('✅ Supabase client created for POST')

    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔐 POST Session check:', { hasSession: !!session, sessionError: sessionError?.message })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('📝 Request body:', body)

    const { name, date_of_birth, gender, additional_notes } = body

    // Validate required fields
    if (!name || !date_of_birth) {
      console.log('❌ Validation failed: missing required fields')
      return NextResponse.json({
        error: 'Name and date of birth are required'
      }, { status: 400 })
    }

    console.log('📊 Creating child with data:', {
      parent_id: session.user.id,
      name,
      date_of_birth,
      gender: gender || null,
      additional_notes: additional_notes || null
    })

    // Create the child profile
    const { data: child, error } = await supabase
      .from('children')
      .insert({
        parent_id: session.user.id,
        name,
        date_of_birth,
        gender: gender || null,
        additional_notes: additional_notes || null
      })
      .select()
      .single()

    console.log('💾 Database insert result:', { child, error: error?.message })

    if (error) {
      console.error('❌ Error creating child:', error)
      return NextResponse.json({
        error: `Failed to create child profile: ${error.message}`
      }, { status: 500 })
    }

    console.log('✅ Child created successfully:', child)
    return NextResponse.json(child)

  } catch (error) {
    console.error('❌ Error in children POST API:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create child profile'
    }, { status: 500 })
  }
}
