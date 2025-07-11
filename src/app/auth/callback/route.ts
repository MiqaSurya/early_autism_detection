import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
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
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Email verification error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=verification_failed`)
      }

      if (data.user) {
        console.log('Email verification successful for:', data.user.email)

        // Update the user's profile (the trigger should have created it already)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            display_name: data.user.user_metadata?.display_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
            full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })

        if (profileError) {
          console.error('Profile update error after verification:', profileError)
          // Continue anyway - profile update failure shouldn't block verification
        }

        // Redirect to verified page which will handle dashboard redirect
        return NextResponse.redirect(`${requestUrl.origin}/auth/verified`)
      }
    } catch (err) {
      console.error('Callback error:', err)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=verification_failed`)
    }
  }

  // If no code or verification failed, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`)
}
