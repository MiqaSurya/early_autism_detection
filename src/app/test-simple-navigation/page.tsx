'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getCurrentLocation } from '@/lib/geoapify'
import { getDirections } from '@/lib/navigation'
import FullNavigationScreen from '@/components/navigation/FullNavigationScreen'

// Test autism center data
const testCenter = {
  id: 'test-center-1',
  name: 'Test Autism Center',
  type: 'diagnostic' as const,
  address: '1600 Amphitheatre Parkway, Mountain View, CA',
  latitude: 37.4221,
  longitude: -122.0841,
  phone: '+1-650-253-0000',
  description: 'Test center for navigation debugging'
}

export default function TestSimpleNavigationPage() {
  const [showNavigation, setShowNavigation] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [status, setStatus] = useState<string>('Ready to test')
  const [isLoading, setIsLoading] = useState(false)

  const testBasicNavigation = async () => {
    setIsLoading(true)
    setStatus('Getting your location...')

    try {
      // Get user location
      const location = await getCurrentLocation()
      setUserLocation([location.lat, location.lon])
      setStatus(`Location found: ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`)

      // Test route calculation
      setStatus('Calculating route...')
      const route = await getDirections(
        { lat: location.lat, lon: location.lon },
        { lat: testCenter.latitude, lon: testCenter.longitude },
        'drive'
      )

      if (route) {
        setStatus(`Route calculated: ${route.summary}`)
        // Start navigation
        setShowNavigation(true)
      } else {
        setStatus('❌ Failed to calculate route')
      }
    } catch (error) {
      setStatus(`❌ Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testWithoutLocation = () => {
    // Use a default location for testing
    setUserLocation([37.7749, -122.4194]) // San Francisco
    setShowNavigation(true)
  }

  if (showNavigation) {
    return (
      <FullNavigationScreen
        destination={testCenter}
        onClose={() => {
          setShowNavigation(false)
          setStatus('Navigation closed')
        }}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">🧪 Simple Navigation Test</h1>
        <p className="text-gray-600">
          This page tests navigation to a sample autism center to identify any issues.
        </p>
      </div>

      {/* Test Center Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">📍 Test Destination</h2>
        <div className="space-y-2 text-sm">
          <div><strong>Name:</strong> {testCenter.name}</div>
          <div><strong>Address:</strong> {testCenter.address}</div>
          <div><strong>Coordinates:</strong> {testCenter.latitude}, {testCenter.longitude}</div>
          <div><strong>Type:</strong> {testCenter.type}</div>
        </div>
      </Card>

      {/* Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">📊 Status</h2>
        <div className="bg-gray-100 p-3 rounded font-mono text-sm">
          {status}
        </div>
        {userLocation && (
          <div className="mt-3 text-sm text-green-600">
            ✅ Your location: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
          </div>
        )}
      </Card>

      {/* Test Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🧪 Test Navigation</h2>
        <div className="space-y-3">
          <Button 
            onClick={testBasicNavigation}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? '⏳ Testing...' : '🚀 Test Navigation with My Location'}
          </Button>
          
          <Button 
            onClick={testWithoutLocation}
            variant="outline"
            className="w-full"
            size="lg"
          >
            🗺️ Test Navigation with Sample Location
          </Button>
          
          <div className="text-xs text-gray-500 text-center">
            The first option uses your real location. The second uses San Francisco as a test location.
          </div>
        </div>
      </Card>

      {/* Environment Check */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">🔧 Environment Check</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Geoapify API Key:</span>
            <span className={process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ? 'text-green-600' : 'text-red-600'}>
              {process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ? '✅ Configured' : '❌ Missing'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Geolocation Support:</span>
            <span className={navigator.geolocation ? 'text-green-600' : 'text-red-600'}>
              {navigator.geolocation ? '✅ Available' : '❌ Not supported'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>HTTPS/Localhost:</span>
            <span className={location.protocol === 'https:' || location.hostname === 'localhost' ? 'text-green-600' : 'text-red-600'}>
              {location.protocol === 'https:' || location.hostname === 'localhost' ? '✅ Secure context' : '❌ Insecure context'}
            </span>
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h2 className="text-xl font-semibold mb-4 text-yellow-900">📋 What to Expect</h2>
        <div className="space-y-2 text-sm text-yellow-800">
          <div>1. Click "Test Navigation with My Location"</div>
          <div>2. Allow location access when prompted</div>
          <div>3. Wait for route calculation</div>
          <div>4. Navigation screen should appear</div>
          <div>5. You should see a route preview with map</div>
          <div>6. Click "Start Navigation" for turn-by-turn</div>
        </div>
      </Card>
    </div>
  )
}
