import { NextRequest, NextResponse } from 'next/server'
import { logger } from './logger'

// Security configuration
const SECURITY_CONFIG = {
  // Allowed origins for CORS
  allowedOrigins: process.env.NODE_ENV === 'production'
    ? [
        process.env.NEXT_PUBLIC_SITE_URL || 'https://early-autism-detection.vercel.app',
        'https://early-autism-detection.vercel.app',
        'https://early-autism-detector.vercel.app'
      ]
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ],
  
  // Rate limiting thresholds
  rateLimits: {
    suspicious: 100, // requests per minute that trigger monitoring
    blocked: 200,    // requests per minute that get blocked
  },
  
  // Blocked user agents (basic bot protection)
  blockedUserAgents: [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
  ],
  
  // Suspicious patterns in URLs
  suspiciousPatterns: [
    /\.php$/,
    /\.asp$/,
    /\.jsp$/,
    /wp-admin/,
    /admin/,
    /phpmyadmin/,
    /\.env/,
    /\.git/,
  ],
}

// Check if origin is allowed
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true // Allow requests without origin (same-origin)
  
  if (process.env.NODE_ENV === 'development') {
    return true // Allow all origins in development
  }
  
  return SECURITY_CONFIG.allowedOrigins.includes(origin)
}

// Check for suspicious requests
export function isSuspiciousRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  const pathname = request.nextUrl.pathname
  
  // Check for blocked user agents
  if (SECURITY_CONFIG.blockedUserAgents.some(pattern => pattern.test(userAgent))) {
    return true
  }
  
  // Check for suspicious URL patterns
  if (SECURITY_CONFIG.suspiciousPatterns.some(pattern => pattern.test(pathname))) {
    return true
  }
  
  return false
}

// Get client IP address
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwarded ? forwarded.split(',')[0] : realIP || request.ip || 'unknown'
  return ip.trim()
}

// Security middleware
export function securityMiddleware(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  const userAgent = request.headers.get('user-agent') || ''
  const ip = getClientIP(request)
  const pathname = request.nextUrl.pathname
  
  // Log security events
  const securityContext = {
    component: 'security',
    metadata: {
      ip,
      userAgent,
      origin,
      pathname,
      method: request.method,
    },
  }
  
  // Check for suspicious requests
  if (isSuspiciousRequest(request)) {
    logger.warn('Suspicious request detected', securityContext)
    
    // Block obviously malicious requests
    if (pathname.includes('..') || pathname.includes('<script>')) {
      logger.error('Malicious request blocked', undefined, securityContext)
      return new NextResponse('Forbidden', { status: 403 })
    }
  }
  
  // CORS handling for API routes
  if (pathname.startsWith('/api/')) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      if (!isOriginAllowed(origin)) {
        logger.warn('CORS preflight rejected', securityContext)
        return new NextResponse('Forbidden', { status: 403 })
      }
      
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      })
    }
    
    // Check origin for actual API requests
    if (origin && !isOriginAllowed(origin)) {
      logger.warn('CORS request rejected', securityContext)
      return new NextResponse('Forbidden', { status: 403 })
    }
  }
  
  return null // Continue to next middleware
}

// Utility to add security headers to responses
export function addSecurityHeaders(response: NextResponse, origin?: string | null): NextResponse {
  // CORS headers for API responses
  if (origin && isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  
  return response
}

// Input sanitization utilities
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

// Export configuration for testing
export { SECURITY_CONFIG }
