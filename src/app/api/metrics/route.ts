import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { performanceMonitor } from '@/lib/monitoring'
import { logger } from '@/lib/logger'

// Admin-only metrics endpoint
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In a real application, you would check if the user has admin privileges
    // For now, we'll allow any authenticated user in development
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement proper admin role checking
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      if (!profile || profile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get all performance metrics
    const metrics = performanceMonitor.getAllMetrics()
    
    // Get system information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV,
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
      timestamp: new Date().toISOString(),
    }

    // Get recent error counts (this would typically come from your error tracking service)
    const errorCounts = {
      last24h: 0, // TODO: Implement actual error counting
      last7d: 0,
      last30d: 0,
    }

    const response = {
      system: systemInfo,
      metrics,
      errors: errorCounts,
      status: 'healthy', // TODO: Determine based on actual metrics
    }

    logger.info('Metrics accessed', {
      userId: session.user.id,
      component: 'metrics-api',
    })

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })

  } catch (error) {
    logger.error('Metrics API error', error as Error, {
      component: 'metrics-api',
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Clear metrics (admin only)
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated and has admin privileges
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In production, check for admin role
    if (process.env.NODE_ENV === 'production') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      if (!profile || profile.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Clear all metrics
    performanceMonitor.clearMetrics()

    logger.info('Metrics cleared', {
      userId: session.user.id,
      component: 'metrics-api',
    })

    return NextResponse.json({ message: 'Metrics cleared successfully' })

  } catch (error) {
    logger.error('Metrics clear error', error as Error, {
      component: 'metrics-api',
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
