'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import dynamic from 'next/dynamic'

// Dynamic import for GeoapifyMap
const GeoapifyMap = dynamic(() => import('@/components/map/GeoapifyMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>
})

export default function TestHardcodedRoutePage() {
  const [showRoute, setShowRoute] = useState(true)

  // Hardcoded route data in the exact format from your routing API
  const hardcodedRoute = {
    coordinates: [
      [101.6869, 3.1390], // Start: KL City Center [longitude, latitude]
      [101.6875, 3.1385],
      [101.6880, 3.1380],
      [101.6890, 3.1370],
      [101.6900, 3.1350],
      [101.6920, 3.1320],
      [101.6950, 3.1280],
      [101.6980, 3.1240],
      [101.7000, 3.1200],
      [101.7020, 3.1150],
      [101.7040, 3.1100],
      [101.7050, 3.1050],
      [101.7060, 3.1000],
      [101.7065, 3.0950],
      [101.7070, 3.0900],
      [101.7072, 3.0850],
      [101.7072, 3.0800],
      [101.7072, 3.0738]  // End: Mid Valley [longitude, latitude]
    ],
    summary: "15.2 km • 18 min"
  }

  // Test centers
  const testCenters = [
    {
      id: 'start',
      name: 'Start Location',
      type: 'diagnostic',
      address: 'KL City Center',
      latitude: 3.1390,
      longitude: 101.6869,
      verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'end',
      name: 'Destination',
      type: 'therapy',
      address: 'Mid Valley',
      latitude: 3.0738,
      longitude: 101.7072,
      verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  const userLocation: [number, number] = [3.1390, 101.6869] // KL City Center

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">🛣️ Hardcoded Route Test</h1>
        <p className="text-gray-600">
          Testing route visualization with hardcoded coordinates - bypassing API to isolate Polyline issues
        </p>
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="flex gap-4 items-center">
          <Button 
            onClick={() => setShowRoute(!showRoute)}
            variant={showRoute ? "default" : "outline"}
          >
            {showRoute ? "Hide Route" : "Show Route"}
          </Button>
          <span className="text-sm text-gray-600">
            Route: {showRoute ? 'Visible' : 'Hidden'} • {hardcodedRoute.coordinates.length} points
          </span>
        </div>
      </Card>

      {/* Route Info */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">📊 Hardcoded Route Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded">
            <strong>Start:</strong>
            <div className="text-blue-600">KL City Center</div>
            <div className="text-xs font-mono">[{hardcodedRoute.coordinates[0][1]}, {hardcodedRoute.coordinates[0][0]}]</div>
          </div>
          <div className="bg-white p-3 rounded">
            <strong>End:</strong>
            <div className="text-blue-600">Mid Valley</div>
            <div className="text-xs font-mono">[{hardcodedRoute.coordinates[hardcodedRoute.coordinates.length-1][1]}, {hardcodedRoute.coordinates[hardcodedRoute.coordinates.length-1][0]}]</div>
          </div>
          <div className="bg-white p-3 rounded">
            <strong>Route Points:</strong>
            <div className="text-blue-600">{hardcodedRoute.coordinates.length}</div>
            <div className="text-xs">Coordinates</div>
          </div>
        </div>
      </Card>

      {/* Map */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🗺️ Map with Hardcoded Route</h2>
        <div className="h-96">
          <GeoapifyMap
            centers={testCenters}
            userLocation={userLocation}
            route={showRoute ? hardcodedRoute : undefined}
            showRoute={showRoute}
            className="h-full w-full"
            zoom={12}
          />
        </div>
        
        <div className="mt-4 text-sm text-gray-600 space-y-1">
          <div><strong>Expected:</strong> Red route line connecting KL City Center to Mid Valley</div>
          <div><strong>Start Marker:</strong> Blue pulsing circle at KL City Center</div>
          <div><strong>End Marker:</strong> Colored marker at Mid Valley</div>
          <div><strong>Route:</strong> Thick red line following the coordinate path</div>
        </div>
      </Card>

      {/* Debug Console */}
      <Card className="p-6 bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">🔍 Debug Information</h2>
        <div className="space-y-3 text-sm">
          <div>
            <strong>Route Coordinates (first 5):</strong>
            <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
              {JSON.stringify(hardcodedRoute.coordinates.slice(0, 5), null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>Expected Leaflet Format (after conversion):</strong>
            <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
              {JSON.stringify(hardcodedRoute.coordinates.slice(0, 5).map(coord => [coord[1], coord[0]]), null, 2)}
            </pre>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-3 rounded">
              <strong>API Format:</strong>
              <div className="text-xs text-gray-600 mt-1">[longitude, latitude] pairs</div>
              <div className="text-xs">From your routing API</div>
            </div>
            <div className="bg-white p-3 rounded">
              <strong>Leaflet Format:</strong>
              <div className="text-xs text-gray-600 mt-1">[latitude, longitude] pairs</div>
              <div className="text-xs">For map display</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h2 className="text-xl font-semibold mb-4 text-yellow-900">📋 Test Instructions</h2>
        <div className="space-y-2 text-sm text-yellow-800">
          <div>1. <strong>Look for red line:</strong> Should connect KL City Center to Mid Valley</div>
          <div>2. <strong>Toggle route:</strong> Use "Hide Route" / "Show Route" button</div>
          <div>3. <strong>Check console:</strong> Look for route rendering logs</div>
          <div>4. <strong>If no line appears:</strong> There's a fundamental Polyline rendering issue</div>
          <div>5. <strong>If line appears:</strong> The issue is with API data or coordinate conversion</div>
        </div>
      </Card>

      {/* Browser Console Check */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h2 className="text-xl font-semibold mb-4 text-green-900">🖥️ Browser Console</h2>
        <div className="text-sm text-green-800">
          <div>Open browser developer tools (F12) and check the console for:</div>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><code>🛣️ Attempting to render route:</code> - Route data logging</li>
            <li><code>✅ Polyline components rendered</code> - Polyline creation confirmation</li>
            <li><code>🛣️ GeoapifyMap route data:</code> - Coordinate conversion details</li>
            <li>Any Leaflet or React Leaflet errors</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
