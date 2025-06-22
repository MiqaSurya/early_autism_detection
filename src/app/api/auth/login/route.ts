import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Login error:', error)
      return new NextResponse(
        JSON.stringify({ error: error.message }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }
    
    return new NextResponse(
      JSON.stringify({ 
        success: true,
        user: data.user
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
    
  } catch (error) {
    console.error('Login exception:', error)
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}