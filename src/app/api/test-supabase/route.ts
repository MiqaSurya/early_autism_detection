import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get environment variables 
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase credentials',
        envKeys: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }, { status: 500 })
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test connection with a simple query
    const { data, error } = await supabase.from('postgres_version').select('*').limit(1)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase connection successful',
      data,
      supabaseUrl,
      supabaseKeyPreview: supabaseKey.substring(0, 5) + '...'
    })
  } catch (error: any) {
    console.error('Test Supabase API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Unknown error connecting to Supabase',
      details: error
    }, { status: 500 })
  }
} 