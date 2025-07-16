// Temporarily disable Sentry to fix deployment issues
const Sentry = {
  captureException: () => {},
  captureMessage: () => {},
  addBreadcrumb: () => {},
  setContext: () => {},
  setTag: () => {},
  setUser: () => {}
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` | ${JSON.stringify(context)}` : ''
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('info', message, context)
    
    if (this.isDevelopment) {
      console.info(formattedMessage)
    }
    
    if (this.isProduction) {
      Sentry.addBreadcrumb({
        message,
        level: 'info',
        data: context,
      })
    }
  }

  warn(message: string, context?: LogContext): void {
    const formattedMessage = this.formatMessage('warn', message, context)
    
    if (this.isDevelopment) {
      console.warn(formattedMessage)
    }
    
    if (this.isProduction) {
      Sentry.captureMessage(message, 'warning')
      Sentry.addBreadcrumb({
        message,
        level: 'warning',
        data: context,
      })
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const formattedMessage = this.formatMessage('error', message, context)
    
    if (this.isDevelopment) {
      console.error(formattedMessage, error)
    }
    
    if (this.isProduction) {
      if (error) {
        Sentry.captureException(error, {
          tags: {
            component: context?.component,
            action: context?.action,
          },
          extra: context?.metadata,
          user: context?.userId ? { id: context.userId } : undefined,
        })
      } else {
        Sentry.captureMessage(message, 'error')
      }
    }
  }

  // Specific logging methods for common scenarios
  apiError(endpoint: string, error: Error, context?: Omit<LogContext, 'component'>): void {
    this.error(`API Error: ${endpoint}`, error, {
      ...context,
      component: 'api',
      metadata: {
        endpoint,
        ...context?.metadata,
      },
    })
  }

  authError(action: string, error: Error, context?: Omit<LogContext, 'component'>): void {
    this.error(`Auth Error: ${action}`, error, {
      ...context,
      component: 'auth',
      action,
    })
  }

  databaseError(operation: string, error: Error, context?: Omit<LogContext, 'component'>): void {
    this.error(`Database Error: ${operation}`, error, {
      ...context,
      component: 'database',
      action: operation,
    })
  }

  userAction(action: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, {
      ...context,
      action,
    })
  }

  performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      ...context,
      component: 'performance',
      action: operation,
      metadata: {
        duration,
        ...context?.metadata,
      },
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export utility functions for common patterns
export const withLogging = <T extends any[], R>(
  fn: (...args: T) => R,
  operation: string,
  context?: LogContext
) => {
  return (...args: T): R => {
    const start = Date.now()
    try {
      const result = fn(...args)
      const duration = Date.now() - start
      logger.performance(operation, duration, context)
      return result
    } catch (error) {
      logger.error(`Error in ${operation}`, error as Error, context)
      throw error
    }
  }
}

export const withAsyncLogging = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operation: string,
  context?: LogContext
) => {
  return async (...args: T): Promise<R> => {
    const start = Date.now()
    try {
      const result = await fn(...args)
      const duration = Date.now() - start
      logger.performance(operation, duration, context)
      return result
    } catch (error) {
      logger.error(`Error in ${operation}`, error as Error, context)
      throw error
    }
  }
}
