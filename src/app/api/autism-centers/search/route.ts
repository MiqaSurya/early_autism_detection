import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  
  const searchTerm = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '50')
  
  if (!searchTerm) {
    return NextResponse.json({ error: 'Search term (q) is required' }, { status: 400 })
  }
  
  try {
    // Search autism centers by name, address, or description
    const { data, error } = await supabase
      .from('autism_centers')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(limit)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
