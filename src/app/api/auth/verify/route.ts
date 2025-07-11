import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid_token', request.url))
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