import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  
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
        stats.byType[center.type] = (stats.byType[center.type] || 0) + 1
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
