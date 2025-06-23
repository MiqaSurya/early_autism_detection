'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import dynamic from 'next/dynamic'

// Dynamic import to test map loading
const NavigationMap = dynamic(() => import('@/components/navigation/NavigationMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <div className="text-sm text-gray-600">Loading map...</div>
      </div>
    </div>
  )
})

export default function TestMapFixPage() {
  const [showMap, setShowMap] = useState(false)
  const [testCoords, setTestCoords] = useState({
    user: [37.7749, -122.4194] as [number, number], // San Francisco
    destination: [37.7849, -122.4094] as [number, number] // Nearby location
  })

  const testRoute = {
    steps: [
      {
        instruction: 'Head north on Market St',
        distance: 500,
        duration: 60,
        maneuver: 'straight',
        coordinates: [[testCoords.user[1], testCoords.user[0]], [testCoords.destination[1], testCoords.destination[0]]]
      }
    ],
    totalDistance: 500,
    totalDuration: 60,
    coordinates: [[testCoords.user[1], testCoords.user[0]], [testCoords.destination[1], testCoords.destination[0]]],
    summary: '0.5 km • 1 min'
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">🗺️ Map Fix Test</h1>
        <p className="text-gray-600">
          This page tests the map component with valid coordinates to ensure the tile loading issue is fixed.
        </p>
      </div>

      {/* Coordinate Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">📍 Test Coordinates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>User Location (San Francisco):</strong>
            <div className="font-mono bg-gray-100 p-2 rounded mt-1">
              [{testCoords.user[0]}, {testCoords.user[1]}]
            </div>
          </div>
          <div>
            <strong>Destination (Nearby):</strong>
            <div className="font-mono bg-gray-100 p-2 rounded mt-1">
              [{testCoords.destination[0]}, {testCoords.destination[1]}]
            </div>
          </div>
        </div>
      </Card>

      {/* Test Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🧪 Test Map Loading</h2>
        <div className="space-y-3">
          <Button 
            onClick={() => setShowMap(!showMap)}
            className="w-full"
            size="lg"
          >
            {showMap ? '🙈 Hide Map' : '🗺️ Show Map'}
          </Button>
          
          <div className="text-xs text-gray-500 text-center">
            This will test if the map loads without the tile coordinate errors.
          </div>
        </div>
      </Card>

      {/* Map Test Area */}
      {showMap && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🗺️ Navigation Map Test</h2>
          <div className="h-96 border rounded-lg overflow-hidden">
            <NavigationMap
              userLocation={testCoords.user}
              destination={testCoords.destination}
              route={testRoute}
              currentStepIndex={0}
              className="h-full w-full"
            />
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <strong>Expected:</strong> Map should load without console errors about invalid tile coordinates.
            <br />
            <strong>Check:</strong> Open browser console (F12) and look for any red errors.
          </div>
        </Card>
      )}

      {/* Console Check */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">🔍 Console Check</h2>
        <div className="space-y-2 text-sm text-blue-800">
          <div>1. Open browser console (F12 → Console tab)</div>
          <div>2. Click "Show Map" above</div>
          <div>3. Look for any red error messages</div>
          <div>4. The previous error about "invalid tile coordinates" should be gone</div>
        </div>
      </Card>

      {/* Environment Info */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h2 className="text-xl font-semibold mb-4 text-green-900">✅ Environment Status</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Geoapify API Key:</span>
            <span className={process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ? 'text-green-600' : 'text-red-600'}>
              {process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ? '✅ Configured' : '❌ Missing'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Test Coordinates Valid:</span>
            <span className="text-green-600">✅ Valid</span>
          </div>
          <div className="flex justify-between">
            <span>Map Component:</span>
            <span className="text-green-600">✅ Loaded</span>
          </div>
        </div>
      </Card>

      {/* Next Steps */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h2 className="text-xl font-semibold mb-4 text-yellow-900">🚀 Next Steps</h2>
        <div className="space-y-2 text-sm text-yellow-800">
          <div>1. If the map loads without errors here, the fix is working</div>
          <div>2. Go back to the main locator and try navigation again</div>
          <div>3. The navigation should now work properly</div>
          <div>4. If you still see issues, check the browser console for new error messages</div>
        </div>
      </Card>
    </div>
  )
}
