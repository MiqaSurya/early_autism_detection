import { logger } from './logger'

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private readonly maxSamples = 100 // Keep last 100 samples per metric

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Record a performance metric
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    // Store in memory for quick access
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const samples = this.metrics.get(name)!
    samples.push(value)
    
    // Keep only the last N samples
    if (samples.length > this.maxSamples) {
      samples.shift()
    }

    // Log to structured logging system
    logger.performance(name, value, {
      component: 'performance-monitor',
      metadata: {
        tags,
        timestamp: Date.now(),
      },
    })
  }

  // Get statistics for a metric
  getMetricStats(name: string): {
    count: number
    min: number
    max: number
    avg: number
    p95: number
    p99: number
  } | null {
    const samples = this.metrics.get(name)
    if (!samples || samples.length === 0) {
      return null
    }

    const sorted = [...samples].sort((a, b) => a - b)
    const count = sorted.length
    const min = sorted[0]
    const max = sorted[count - 1]
    const avg = sorted.reduce((sum, val) => sum + val, 0) / count
    const p95 = sorted[Math.floor(count * 0.95)]
    const p99 = sorted[Math.floor(count * 0.99)]

    return { count, min, max, avg, p95, p99 }
  }

  // Get all metrics
  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {}

    this.metrics.forEach((samples, name) => {
      result[name] = this.getMetricStats(name)
    })

    return result
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear()
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Decorator for measuring function execution time
export function measurePerformance(metricName: string, tags?: Record<string, string>) {
  return function <T extends any[], R>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => R>
  ) {
    const method = descriptor.value!

    descriptor.value = function (this: any, ...args: T): R {
      const start = performance.now()
      try {
        const result = method.apply(this, args)
        const duration = performance.now() - start

        performanceMonitor.recordMetric(metricName, duration, {
          ...tags,
          method: propertyName,
          status: 'success',
        })

        return result
      } catch (error) {
        const duration = performance.now() - start

        performanceMonitor.recordMetric(metricName, duration, {
          ...tags,
          method: propertyName,
          status: 'error',
        })

        throw error
      }
    } as any

    return descriptor
  }
}

// Async version of the performance decorator
export function measureAsyncPerformance(metricName: string, tags?: Record<string, string>) {
  return function <T extends any[], R>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const method = descriptor.value!

    descriptor.value = async function (this: any, ...args: T): Promise<R> {
      const start = performance.now()
      try {
        const result = await method.apply(this, args)
        const duration = performance.now() - start

        performanceMonitor.recordMetric(metricName, duration, {
          ...tags,
          method: propertyName,
          status: 'success',
        })

        return result
      } catch (error) {
        const duration = performance.now() - start

        performanceMonitor.recordMetric(metricName, duration, {
          ...tags,
          method: propertyName,
          status: 'error',
        })

        throw error
      }
    } as any

    return descriptor
  }
}

// Utility functions for common measurements
export const Metrics = {
  // API response times
  apiResponse: (endpoint: string, duration: number, status: number) => {
    performanceMonitor.recordMetric('api_response_time', duration, {
      endpoint,
      status: status.toString(),
      category: status >= 200 && status < 300 ? 'success' : 'error',
    })
  },

  // Database query times
  dbQuery: (operation: string, table: string, duration: number, success: boolean) => {
    performanceMonitor.recordMetric('db_query_time', duration, {
      operation,
      table,
      status: success ? 'success' : 'error',
    })
  },

  // External API calls
  externalApi: (service: string, duration: number, success: boolean) => {
    performanceMonitor.recordMetric('external_api_time', duration, {
      service,
      status: success ? 'success' : 'error',
    })
  },

  // Page load times (client-side)
  pageLoad: (page: string, duration: number) => {
    performanceMonitor.recordMetric('page_load_time', duration, {
      page,
    })
  },

  // Component render times
  componentRender: (component: string, duration: number) => {
    performanceMonitor.recordMetric('component_render_time', duration, {
      component,
    })
  },

  // User interactions
  userInteraction: (action: string, duration: number) => {
    performanceMonitor.recordMetric('user_interaction_time', duration, {
      action,
    })
  },
}

// Error tracking utilities
export const ErrorTracking = {
  // Track API errors
  apiError: (endpoint: string, error: Error, statusCode?: number) => {
    logger.apiError(endpoint, error, {
      metadata: {
        statusCode,
        timestamp: Date.now(),
      },
    })
  },

  // Track database errors
  dbError: (operation: string, table: string, error: Error) => {
    logger.databaseError(operation, error, {
      metadata: {
        table,
        timestamp: Date.now(),
      },
    })
  },

  // Track authentication errors
  authError: (action: string, error: Error, userId?: string) => {
    logger.authError(action, error, {
      userId,
      metadata: {
        timestamp: Date.now(),
      },
    })
  },

  // Track general application errors
  appError: (component: string, error: Error, context?: Record<string, any>) => {
    logger.error(`Application error in ${component}`, error, {
      component,
      metadata: {
        context,
        timestamp: Date.now(),
      },
    })
  },
}

// Health check utilities
export const HealthChecks = {
  // Check if a service is responding
  async checkService(name: string, url: string, timeout = 5000): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch(url, {
        signal: controller.signal,
        method: 'HEAD',
      })
      
      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      logger.warn(`Health check failed for ${name}`, {
        component: 'health-check',
        metadata: {
          service: name,
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })
      return false
    }
  },

  // Check database connectivity
  async checkDatabase(): Promise<boolean> {
    try {
      // This would be implemented based on your database client
      // For now, we'll assume it's healthy if no errors are thrown
      return true
    } catch (error) {
      logger.error('Database health check failed', error as Error, {
        component: 'health-check',
      })
      return false
    }
  },
}

// Export for use in API routes and components
// PerformanceMonitor is already exported above
