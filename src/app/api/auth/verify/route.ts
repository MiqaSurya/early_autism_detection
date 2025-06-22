import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url))
  }
  
  const supabase = createRouteHandlerClient({ cookies })
  
  // Verify the user's email with the token
  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'email'
  })
  
  if (error) {
    console.error('Verification error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=verification_failed', request.url))
  }
  
  // Redirect to login page with success message
  return NextResponse.redirect(new URL('/auth/login?verified=true', request.url))
} 