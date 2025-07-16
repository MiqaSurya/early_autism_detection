'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Only import Sentry in production to avoid development warnings
const Sentry = process.env.NODE_ENV === 'production'
  ? require('@sentry/nextjs')
  : { captureException: () => {}, showReportDialog: () => {} }

interface GlobalErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorId?: string
}

interface GlobalErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      const errorId = Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          component: 'GlobalErrorBoundary',
        },
      })
      this.setState({ errorId })
    } else {
      console.error('Global Error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-6">
          <div className="text-center max-w-md bg-white rounded-lg shadow-lg p-8">
            <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-red-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-red-700 mb-4">
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-4 p-3 bg-red-50 rounded text-sm">
                <summary className="cursor-pointer font-medium">Error Details</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            
            {this.state.errorId && (
              <p className="text-xs text-gray-500 mb-4">
                Error ID: {this.state.errorId}
              </p>
            )}
            
            <div className="space-y-3">
              <Button
                onClick={() => this.setState({ hasError: false })}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
