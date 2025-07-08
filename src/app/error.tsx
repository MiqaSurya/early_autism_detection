'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { logger } from '@/lib/logger'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error for monitoring
    logger.error('Application error', error, {
      component: 'ErrorPage',
      metadata: {
        digest: error.digest,
        message: error.message,
        stack: error.stack,
      },
    })
  }, [error])

  const handleReload = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  const handleReportError = () => {
    const subject = encodeURIComponent('Early Autism Detector - Error Report')
    const body = encodeURIComponent(`
Error Details:
- Message: ${error.message}
- Digest: ${error.digest || 'N/A'}
- Time: ${new Date().toISOString()}
- URL: ${window.location.href}
- User Agent: ${navigator.userAgent}

Please describe what you were doing when this error occurred:
[Your description here]
    `)
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-6">
      <Card className="max-w-md w-full bg-white shadow-lg p-8 text-center">
        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-900 mb-2">
            Oops! Something went wrong
          </h1>
          <p className="text-red-700 mb-4">
            We're sorry, but something unexpected happened. Don't worry - your data is safe.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <h3 className="font-semibold text-red-800 mb-2">Error Details (Development)</h3>
            <p className="text-sm text-red-700 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={reset} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            onClick={handleReload} 
            variant="outline" 
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
          
          <Button 
            onClick={handleGoHome} 
            variant="outline" 
            className="w-full"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          
          <Button 
            onClick={handleReportError} 
            variant="ghost" 
            className="w-full text-gray-600"
          >
            <Mail className="h-4 w-4 mr-2" />
            Report This Error
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If this problem persists, please contact our support team.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-400 mt-2">
              Error Reference: {error.digest}
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
