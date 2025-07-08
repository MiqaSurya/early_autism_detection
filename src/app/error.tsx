'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error for monitoring in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error)
    }
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
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
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
          <button
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>

          <button
            onClick={handleReload}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </button>

          <button
            onClick={handleGoHome}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
          >
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </button>

          <button
            onClick={handleReportError}
            className="w-full text-gray-600 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
          >
            <Mail className="h-4 w-4 mr-2" />
            Report This Error
          </button>
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
      </div>
    </div>
  )
}
