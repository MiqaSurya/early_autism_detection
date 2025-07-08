import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest } from 'next/server'
import { logger } from './logger'

// Create Redis instance (fallback to memory if Redis not available)
const redis = process.env.REDIS_URL && process.env.REDIS_TOKEN
  ? new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN
    })
  : undefined

// Rate limit configurations
const rateLimitConfigs = {
  // Authentication endpoints - stricter limits
  auth: new Ratelimit({
    redis: redis as any || new Map(),
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute
    analytics: true,
  }),

  // Chat endpoints - moderate limits
  chat: new Ratelimit({
    redis: redis as any || new Map(),
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
    analytics: true,
  }),

  // Data endpoints - generous limits
  data: new Ratelimit({
    redis: redis as any || new Map(),
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
  }),

  // General API endpoints
  api: new Ratelimit({
    redis: redis as any || new Map(),
    limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
    analytics: true,
  }),

  // External API calls (to prevent abuse of our API keys)
  external: new Ratelimit({
    redis: redis as any || new Map(),
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests per minute
    analytics: true,
  }),
}

export type RateLimitType = keyof typeof rateLimitConfigs

// Get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from session if available
  const userId = request.headers.get('x-user-id')
  if (userId) {
    return `user:${userId}`
  }
  
  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  return `ip:${ip}`
}

// Rate limit check function
export async function checkRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api'
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: Date
}> {
  const identifier = getClientIdentifier(request)
  const ratelimit = rateLimitConfigs[type]
  
  try {
    const result = await ratelimit.limit(identifier)
    
    // Log rate limit events
    if (!result.success) {
      logger.warn('Rate limit exceeded', {
        component: 'rate-limit',
        metadata: {
          identifier,
          type,
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
        },
      })
    }
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
    }
  } catch (error) {
    logger.error('Rate limit check failed', error as Error, {
      component: 'rate-limit',
      metadata: { identifier, type },
    })
    
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: new Date(),
    }
  }
}

// Middleware wrapper for API routes
export function withRateLimit(type: RateLimitType = 'api') {
  return function <T extends any[], R>(
    handler: (request: NextRequest, ...args: T) => Promise<R>
  ) {
    return async (request: NextRequest, ...args: T): Promise<R> => {
      const rateLimitResult = await checkRateLimit(request, type)
      
      if (!rateLimitResult.success) {
        const response = new Response(
          JSON.stringify({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': rateLimitResult.limit.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
              'Retry-After': Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString(),
            },
          }
        )
        return response as R
      }
      
      // Add rate limit headers to successful responses
      const result = await handler(request, ...args)
      
      // If result is a Response, add headers
      if (result instanceof Response) {
        result.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
        result.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
        result.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toISOString())
      }
      
      return result
    }
  }
}

// Utility for external API calls
export async function checkExternalApiLimit(
  apiName: string,
  identifier?: string
): Promise<boolean> {
  const id = identifier || `external:${apiName}`
  const ratelimit = rateLimitConfigs.external
  
  try {
    const result = await ratelimit.limit(id)
    
    if (!result.success) {
      logger.warn(`External API rate limit exceeded for ${apiName}`, {
        component: 'external-api',
        metadata: { apiName, identifier: id },
      })
    }
    
    return result.success
  } catch (error) {
    logger.error(`External API rate limit check failed for ${apiName}`, error as Error)
    return true // Fail open
  }
}

// Export rate limit types for use in API routes
export { rateLimitConfigs }
