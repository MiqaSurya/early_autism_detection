import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Get the session and refresh if needed
    const { data: { session }, error } = await supabase.auth.getSession()

    console.log('Middleware - Path:', req.nextUrl.pathname)
    console.log('Middleware - Session exists:', !!session)
    console.log('Middleware - User ID:', session?.user?.id || 'none')
    console.log('Middleware - Session error:', error)

    // Protected routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        console.log('Middleware - Redirecting to login (no session)')
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      console.log('Middleware - Allowing dashboard access')
    }

    // Auth routes (when already logged in) - Re-enable this
    if (req.nextUrl.pathname.startsWith('/auth')) {
      if (session) {
        console.log('Middleware - Redirecting to dashboard (already logged in)')
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
}
