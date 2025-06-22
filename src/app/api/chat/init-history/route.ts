import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    // Create a Supabase client with cookies
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('No session found, returning unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Checking if chat_history table exists')

    // First, let's check if the table exists by querying it directly
    try {
      // Use a simpler query that just selects id instead of count(*)
      const { data, error } = await supabase
        .from('chat_history')
        .select('id')
        .limit(1)
      
      // If no error, the table exists
      if (!error) {
        console.log('Chat history table exists')
        return NextResponse.json({ success: true, message: 'Chat history table exists' })
      }

      // If we got an error about the table not existing
      if (error && error.message && error.message.includes('does not exist')) {
        console.log('Chat history table does not exist')
        return NextResponse.json({ 
          error: 'Chat history table does not exist',
          needsSetup: true,
          details: error.message
        }, { status: 404 })
      }

      // Some other error occurred
      console.error('Error checking chat_history table:', error)
      return NextResponse.json({ 
        error: 'Error checking chat history table', 
        details: error.message 
      }, { status: 500 })
    } catch (queryError) {
      console.error('Exception checking chat_history table:', queryError)
      return NextResponse.json({ 
        error: 'Exception checking chat history table',
        details: queryError instanceof Error ? queryError.message : 'Unknown error'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Chat history initialization error:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred during initialization',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
