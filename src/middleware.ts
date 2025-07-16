import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { securityMiddleware, addSecurityHeaders } from '@/lib/security'
import { logger } from '@/lib/logger'

export async function middleware(req: NextRequest) {
  // Apply security middleware first
  const securityResponse = securityMiddleware(req)
  if (securityResponse) {
    return securityResponse
  }

  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    // Block debug/test routes in production
    if (process.env.NODE_ENV === 'production') {
      const debugRoutes = [
        '/debug',
        '/test',
        '/bypass',
        '/simple-login',
        '/admin-debug',
        '/admin-login-test',
        '/admin-test',
        '/fix-database',
        '/setup-database',
        '/test-db-content',
        '/test-env',
        '/test-scoring-simple',
        '/test-sync'
      ]
      if (debugRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Get the session and refresh if needed
    const { data: { session }, error } = await supabase.auth.getSession()

    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Middleware processing', {
        component: 'middleware',
        metadata: {
          path: req.nextUrl.pathname,
          hasSession: !!session,
          userId: session?.user?.id || 'none',
          error: error?.message
        }
      })
    }

    // Redirect root path to auth/login
    if (req.nextUrl.pathname === '/') {
      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware - Redirecting root to auth/login')
      }
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Protected routes
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      if (!session) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Middleware - Redirecting to login (no session)')
        }
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware - Allowing dashboard access')
      }
    }



    // Center portal routes - let them handle their own auth
    if (req.nextUrl.pathname.startsWith('/center-portal')) {
      // Allow center portal to handle its own authentication
      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware - Allowing center portal access (self-managed auth)')
      }
    }

    // Auth routes (when already logged in)
    if (req.nextUrl.pathname.startsWith('/auth')) {
      if (session) {
        // Allow access to registration page even when logged in
        // This allows users to register new accounts or help others register
        if (req.nextUrl.pathname === '/auth/register') {
          if (process.env.NODE_ENV === 'development') {
            console.log('Middleware - Allowing registration page access (even when authenticated)')
          }
          // Continue to registration page
        } else {
          // For other auth pages (like login), redirect to dashboard
          if (process.env.NODE_ENV === 'development') {
            logger.debug('Redirecting authenticated user from auth page', {
              component: 'middleware',
              metadata: { path: req.nextUrl.pathname }
            })
          }
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
    }

    // Add security headers to response
    const origin = req.headers.get('origin')
    return addSecurityHeaders(res, origin)
  } catch (error) {
    logger.error('Middleware error', error as Error, {
      component: 'middleware',
      metadata: {
        path: req.nextUrl.pathname,
        method: req.method
      }
    })
    return addSecurityHeaders(res, req.headers.get('origin'))
  }
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/auth/:path*', '/center-portal/:path*']
}
