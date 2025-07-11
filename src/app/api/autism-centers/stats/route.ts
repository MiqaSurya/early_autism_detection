import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

export async function GET(request: Request) {
  // Ensure this route is never statically generated
  if (process.env.NODE_ENV === 'production' && !request.headers.get('user-agent')) {
    return NextResponse.json({ error: 'This endpoint requires a user agent' }, { status: 400 })
  }

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
    // Get basic stats from autism_centers table
    const { data, error } = await supabase
      .from('autism_centers')
      .select('type, verified')
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Calculate statistics
    const stats = {
      total: data?.length || 0,
      byType: {
        diagnostic: 0,
        therapy: 0,
        support: 0,
        education: 0
      },
      verified: 0,
      unverified: 0
    }
    
    data?.forEach(center => {
      // Count by type
      if (center.type && stats.byType.hasOwnProperty(center.type)) {
        const centerType = center.type as keyof typeof stats.byType
        if (centerType in stats.byType) {
          stats.byType[centerType] = (stats.byType[centerType] || 0) + 1
        }
      }
      
      // Count verification status
      if (center.verified) {
        stats.verified++
      } else {
        stats.unverified++
      }
    })
    
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
