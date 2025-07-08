'use client'

import { useState, useEffect } from 'react'
import { MapPin, RefreshCw } from 'lucide-react'

export default function TestAdminLocationsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simple test to see if the page loads
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading admin locations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-red-800 font-medium mb-2">Error Loading Page</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Test Admin Locations</h1>
            <p className="text-gray-600 mt-2">Testing basic page functionality</p>
          </div>
        </div>

        {/* Simple content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Basic Test Page</h2>
          </div>
          <p className="text-gray-600">
            This is a minimal test page to check if the admin locations route works.
            If you can see this, the basic routing is working.
          </p>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">✅ Page Loading Success</h3>
            <p className="text-green-700 text-sm">
              The admin locations page route is working correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
