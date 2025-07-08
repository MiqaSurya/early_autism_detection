import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/logger'

interface HealthCheck {
  service: string
  status: 'healthy' | 'unhealthy' | 'degraded'
  responseTime?: number
  error?: string
  details?: Record<string, any>
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  environment: string
  uptime: number
  checks: HealthCheck[]
  summary: {
    total: number
    healthy: number
    unhealthy: number
    degraded: number
  }
}

// Check Supabase connection
async function checkSupabase(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Simple query to test connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single()
    
    const responseTime = Date.now() - start
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is OK
      throw error
    }
    
    return {
      service: 'supabase',
      status: responseTime > 5000 ? 'degraded' : 'healthy',
      responseTime,
      details: {
        connected: true,
        region: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') ? 'cloud' : 'self-hosted'
      }
    }
  } catch (error) {
    return {
      service: 'supabase',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Check DeepSeek API
async function checkDeepSeek(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return {
        service: 'deepseek',
        status: 'unhealthy',
        error: 'API key not configured',
      }
    }

    // Simple API call to check connectivity
    const response = await fetch('https://api.deepseek.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    const responseTime = Date.now() - start

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return {
      service: 'deepseek',
      status: responseTime > 5000 ? 'degraded' : 'healthy',
      responseTime,
      details: {
        connected: true,
        status: response.status,
      }
    }
  } catch (error) {
    return {
      service: 'deepseek',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Check Geoapify API
async function checkGeoapify(): Promise<HealthCheck> {
  const start = Date.now()
  try {
    if (!process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY) {
      return {
        service: 'geoapify',
        status: 'unhealthy',
        error: 'API key not configured',
      }
    }

    // Simple API call to check connectivity
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=test&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }
    )

    const responseTime = Date.now() - start

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return {
      service: 'geoapify',
      status: responseTime > 5000 ? 'degraded' : 'healthy',
      responseTime,
      details: {
        connected: true,
        status: response.status,
      }
    }
  } catch (error) {
    return {
      service: 'geoapify',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Main health check handler
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Run all health checks in parallel
    const [supabaseCheck, deepseekCheck, geoapifyCheck] = await Promise.all([
      checkSupabase(),
      checkDeepSeek(),
      checkGeoapify(),
    ])

    const checks = [supabaseCheck, deepseekCheck, geoapifyCheck]
    
    // Calculate summary
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
    }

    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy'
    if (summary.unhealthy > 0) {
      overallStatus = 'unhealthy'
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded'
    }

    const healthResponse: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime ? process.uptime() : 0,
      checks,
      summary,
    }

    // Log health check results
    const responseTime = Date.now() - startTime
    logger.info('Health check completed', {
      component: 'health-check',
      metadata: {
        status: overallStatus,
        responseTime,
        summary,
      },
    })

    // Return appropriate HTTP status
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503

    return NextResponse.json(healthResponse, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })

  } catch (error) {
    logger.error('Health check failed', error as Error, {
      component: 'health-check',
    })

    const errorResponse: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
      environment: process.env.NODE_ENV || 'development',
      uptime: 0,
      checks: [],
      summary: {
        total: 0,
        healthy: 0,
        unhealthy: 1,
        degraded: 0,
      },
    }

    return NextResponse.json(errorResponse, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  }
}
