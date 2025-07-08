import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
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
  const supabase = createMiddlewareClient({ req, res })

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

    // Auth routes (when already logged in)
    if (req.nextUrl.pathname.startsWith('/auth')) {
      if (session) {
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Redirecting authenticated user from auth page', {
            component: 'middleware',
            metadata: { path: req.nextUrl.pathname }
          })
        }
        return NextResponse.redirect(new URL('/dashboard', req.url))
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
  matcher: ['/dashboard/:path*', '/auth/:path*']
}
