'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { calculateRoute, RouteResult } from '@/lib/routing'
import { getDirections, NavigationRoute } from '@/lib/navigation'
import NavigationMap from '@/components/navigation/NavigationMap'
import dynamic from 'next/dynamic'

// Dynamic import for GeoapifyMap
const GeoapifyMap = dynamic(() => import('@/components/map/GeoapifyMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>
})

// Your exact example coordinates
const EXAMPLE_ROUTES = {
  klToMidValley: {
    name: "KL to Mid Valley",
    start: { lat: 3.1390, lon: 101.6869 },
    end: { lat: 3.0738, lon: 101.7072 }
  },
  klToKLCC: {
    name: "KL to KLCC", 
    start: { lat: 3.1390, lon: 101.6869 },
    end: { lat: 3.1578, lon: 101.7123 }
  }
}

export default function TestRouteVisualizationPage() {
  const [startLat, setStartLat] = useState('3.1390')
  const [startLon, setStartLon] = useState('101.6869')
  const [endLat, setEndLat] = useState('3.0738')
  const [endLon, setEndLon] = useState('101.7072')
  
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
  const [navigationRoute, setNavigationRoute] = useState<NavigationRoute | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Test route calculation and visualization
  const testRouteVisualization = async () => {
    const start = { latitude: parseFloat(startLat), longitude: parseFloat(startLon) }
    const end = { latitude: parseFloat(endLat), longitude: parseFloat(endLon) }
    
    setLoading(true)
    setError(null)
    setDebugInfo(null)
    
    try {
      console.log('🛣️ Testing route visualization...')
      console.log('Start:', start)
      console.log('End:', end)
      
      // Test routing library
      console.log('📍 Step 1: Calculate route with routing library...')
      const route = await calculateRoute(start, end, { mode: 'drive' })
      
      if (route) {
        console.log('✅ Route calculated:', route)
        console.log('📊 Route coordinates count:', route.coordinates.length)
        console.log('🎯 First coordinate:', route.coordinates[0])
        console.log('🏁 Last coordinate:', route.coordinates[route.coordinates.length - 1])
        setRouteResult(route)
        
        // Test navigation library
        console.log('📍 Step 2: Calculate route with navigation library...')
        const navRoute = await getDirections(
          { lat: start.latitude, lon: start.longitude },
          { lat: end.latitude, lon: end.longitude },
          'drive'
        )
        
        if (navRoute) {
          console.log('✅ Navigation route calculated:', navRoute)
          console.log('📊 Navigation coordinates count:', navRoute.coordinates.length)
          setNavigationRoute(navRoute)
        } else {
          console.log('❌ Navigation route failed')
        }
        
        // Debug info
        setDebugInfo({
          routingCoordinates: route.coordinates.slice(0, 5), // First 5 points
          navigationCoordinates: navRoute?.coordinates.slice(0, 5) || [],
          routingFormat: 'Routing API returns [longitude, latitude] pairs',
          navigationFormat: 'Navigation API returns [longitude, latitude] pairs',
          leafletFormat: 'Leaflet expects [latitude, longitude] pairs',
          conversion: 'We convert [lon, lat] → [lat, lon] for display'
        })
        
      } else {
        setError('No route found')
      }
      
    } catch (err) {
      console.error('❌ Route visualization test failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate route')
    } finally {
      setLoading(false)
    }
  }

  // Use example route
  const useExampleRoute = (example: any) => {
    setStartLat(example.start.lat.toString())
    setStartLon(example.start.lon.toString())
    setEndLat(example.end.lat.toString())
    setEndLon(example.end.lon.toString())
  }

  // Auto-test on page load
  useEffect(() => {
    testRouteVisualization()
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">🛣️ Route Visualization Test</h1>
        <p className="text-gray-600">
          Testing route highlighting on maps - debugging why routes aren't showing up visually
        </p>
      </div>

      {/* Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🎮 Test Controls</h2>
        <div className="space-y-4">
          {/* Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input
              value={startLat}
              onChange={(e) => setStartLat(e.target.value)}
              placeholder="Start Latitude"
              type="number"
              step="any"
            />
            <Input
              value={startLon}
              onChange={(e) => setStartLon(e.target.value)}
              placeholder="Start Longitude"
              type="number"
              step="any"
            />
            <Input
              value={endLat}
              onChange={(e) => setEndLat(e.target.value)}
              placeholder="End Latitude"
              type="number"
              step="any"
            />
            <Input
              value={endLon}
              onChange={(e) => setEndLon(e.target.value)}
              placeholder="End Longitude"
              type="number"
              step="any"
            />
          </div>

          {/* Example Routes */}
          <div>
            <label className="block text-sm font-medium mb-2">Quick Examples:</label>
            <div className="flex gap-2">
              {Object.entries(EXAMPLE_ROUTES).map(([key, route]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => useExampleRoute(route)}
                >
                  {route.name}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={testRouteVisualization} disabled={loading} className="w-full">
            {loading ? 'Testing Route Visualization...' : '🧪 Test Route Visualization'}
          </Button>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-red-800">❌ {error}</div>
        </Card>
      )}

      {/* Debug Info */}
      {debugInfo && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">🔍 Debug Information</h2>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Routing API Coordinates (first 5):</strong>
              <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
                {JSON.stringify(debugInfo.routingCoordinates, null, 2)}
              </pre>
            </div>
            
            <div>
              <strong>Navigation API Coordinates (first 5):</strong>
              <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
                {JSON.stringify(debugInfo.navigationCoordinates, null, 2)}
              </pre>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white p-3 rounded">
                <strong>Routing Format:</strong>
                <div className="text-xs text-gray-600 mt-1">{debugInfo.routingFormat}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <strong>Navigation Format:</strong>
                <div className="text-xs text-gray-600 mt-1">{debugInfo.navigationFormat}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <strong>Leaflet Format:</strong>
                <div className="text-xs text-gray-600 mt-1">{debugInfo.leafletFormat}</div>
              </div>
            </div>
            
            <div className="bg-yellow-100 p-3 rounded">
              <strong>Conversion:</strong>
              <div className="text-xs text-gray-700 mt-1">{debugInfo.conversion}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Route Results */}
      {routeResult && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h2 className="text-xl font-semibold mb-4 text-green-900">✅ Route Calculated</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded">
              <strong>Distance:</strong>
              <div className="text-lg font-bold text-green-600">
                {(routeResult.totalDistance / 1000).toFixed(1)} km
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <strong>Duration:</strong>
              <div className="text-lg font-bold text-blue-600">
                {Math.round(routeResult.totalDuration / 60)} min
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <strong>Coordinates:</strong>
              <div className="text-lg font-bold text-purple-600">
                {routeResult.coordinates.length} points
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Maps Side by Side */}
      {routeResult && navigationRoute && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GeoapifyMap with Route */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">🗺️ GeoapifyMap with Route</h3>
            <div className="h-96">
              <GeoapifyMap
                centers={[]}
                userLocation={[parseFloat(startLat), parseFloat(startLon)]}
                route={{
                  coordinates: routeResult.coordinates,
                  summary: routeResult.summary
                }}
                showRoute={true}
                className="h-full w-full"
                zoom={13}
              />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Should show blue dashed line from start to end
            </div>
          </Card>

          {/* NavigationMap with Route */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">🧭 NavigationMap with Route</h3>
            <div className="h-96">
              <NavigationMap
                userLocation={[parseFloat(startLat), parseFloat(startLon)]}
                destination={[parseFloat(endLat), parseFloat(endLon)]}
                route={navigationRoute}
                className="h-full w-full"
              />
            </div>
            <div className="mt-2 text-xs text-gray-600">
              Should show solid blue line with navigation markers
            </div>
          </Card>
        </div>
      )}

      {/* Instructions */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h2 className="text-xl font-semibold mb-4 text-yellow-900">📋 What to Look For</h2>
        <div className="space-y-2 text-sm text-yellow-800">
          <div>1. <strong>Route Lines:</strong> You should see blue lines connecting start and end points</div>
          <div>2. <strong>Markers:</strong> Blue circle for start, red circle for destination</div>
          <div>3. <strong>Console Logs:</strong> Check browser console for coordinate data</div>
          <div>4. <strong>Debug Info:</strong> Verify coordinate formats are correct</div>
          <div>5. <strong>Map Bounds:</strong> Maps should automatically fit to show the entire route</div>
        </div>
      </Card>
    </div>
  )
}
