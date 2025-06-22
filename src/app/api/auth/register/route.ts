import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Create the user with email confirmation required
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/login?verified=true`,
        data: {
          email_confirmed: false
        }
      }
    })
    
    if (error) {
      console.error('Registration error:', error)
      return new NextResponse(
        JSON.stringify({ error: error.message }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    if (data.user?.identities?.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Email already registered' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
    
    // Return success response
    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent. Please check your inbox.' 
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    
  } catch (error) {
    console.error('Registration exception:', error)
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}