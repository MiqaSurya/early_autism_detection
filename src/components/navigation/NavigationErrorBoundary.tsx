'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavigationErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface NavigationErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export class NavigationErrorBoundary extends React.Component<
  NavigationErrorBoundaryProps,
  NavigationErrorBoundaryState
> {
  constructor(props: NavigationErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): NavigationErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Navigation Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="h-full w-full bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 mb-2">Navigation Error</h2>
            <p className="text-red-700 mb-4">
              There was an issue loading the navigation system. This might be due to:
            </p>
            <ul className="text-sm text-red-600 mb-6 text-left">
              <li>• Missing map configuration</li>
              <li>• Network connectivity issues</li>
              <li>• Browser compatibility problems</li>
            </ul>
            <div className="space-y-3">
              <Button
                onClick={() => this.setState({ hasError: false })}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => {
                  const googleMapsUrl = `https://www.google.com/maps/`
                  window.open(googleMapsUrl, '_blank')
                }}
                variant="outline"
                className="w-full"
              >
                Open Google Maps Instead
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default NavigationErrorBoundary
