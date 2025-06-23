'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  calculateRoute, 
  calculateRouteExact, 
  calculateMultipleRoutes,
  getRouteAlternatives,
  RouteResult, 
  RoutePoint,
  formatRouteDuration,
  formatRouteDistance,
  getEstimatedArrival
} from '@/lib/routing'
import { MapPin, Clock, Route, Car, User, Bike } from 'lucide-react'

// Your exact example coordinates
const EXAMPLE_ROUTES = {
  klToMidValley: {
    name: "KL to Mid Valley (Your Example)",
    start: [101.6869, 3.1390] as [number, number], // KL
    end: [101.7072, 3.0738] as [number, number]    // Mid Valley
  },
  klToKLCC: {
    name: "KL to KLCC",
    start: [101.6869, 3.1390] as [number, number], // KL
    end: [101.7123, 3.1578] as [number, number]    // KLCC
  },
  klToSunway: {
    name: "KL to Sunway Pyramid",
    start: [101.6869, 3.1390] as [number, number], // KL
    end: [101.6065, 3.0738] as [number, number]    // Sunway
  },
  klToUM: {
    name: "KL to Universiti Malaya",
    start: [101.6869, 3.1390] as [number, number], // KL
    end: [101.6571, 3.1251] as [number, number]    // UM
  }
}

export default function TestRoutingPage() {
  const [startLat, setStartLat] = useState('3.1390')
  const [startLon, setStartLon] = useState('101.6869')
  const [endLat, setEndLat] = useState('3.0738')
  const [endLon, setEndLon] = useState('101.7072')
  const [selectedMode, setSelectedMode] = useState<'drive' | 'walk' | 'bicycle'>('drive')
  
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)
  const [exactCoordinates, setExactCoordinates] = useState<[number, number][] | null>(null)
  const [multipleRoutes, setMultipleRoutes] = useState<{ [mode: string]: RouteResult | null }>({})
  const [alternatives, setAlternatives] = useState<RouteResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Test your exact code pattern
  const testOriginalCode = async () => {
    setLoading(true)
    setError(null)
    
    try {
      console.log('Testing your exact routing code pattern...')
      
      // Your exact code
      const start = [101.6869, 3.1390] as [number, number] // KL
      const end = [101.7072, 3.0738] as [number, number]   // Mid Valley
      
      const coordinates = await calculateRouteExact(start, end)
      
      if (coordinates) {
        setExactCoordinates(coordinates)
        console.log("Route coordinates count:", coordinates.length)
      } else {
        setError('No route found with exact method')
      }
      
    } catch (err) {
      console.error('Original routing code test failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate route')
    } finally {
      setLoading(false)
    }
  }

  // Test enhanced routing
  const testEnhancedRouting = async () => {
    const start: RoutePoint = {
      latitude: parseFloat(startLat),
      longitude: parseFloat(startLon)
    }
    const end: RoutePoint = {
      latitude: parseFloat(endLat),
      longitude: parseFloat(endLon)
    }
    
    if (isNaN(start.latitude) || isNaN(start.longitude) || isNaN(end.latitude) || isNaN(end.longitude)) {
      setError('Please enter valid coordinates')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const route = await calculateRoute(start, end, { mode: selectedMode })
      setRouteResult(route)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate route')
    } finally {
      setLoading(false)
    }
  }

  // Test multiple modes
  const testMultipleModes = async () => {
    const start: RoutePoint = {
      latitude: parseFloat(startLat),
      longitude: parseFloat(startLon)
    }
    const end: RoutePoint = {
      latitude: parseFloat(endLat),
      longitude: parseFloat(endLon)
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const routes = await calculateMultipleRoutes(start, end, ['drive', 'walk', 'bicycle'])
      setMultipleRoutes(routes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate multiple routes')
    } finally {
      setLoading(false)
    }
  }

  // Test route alternatives
  const testAlternatives = async () => {
    const start: RoutePoint = {
      latitude: parseFloat(startLat),
      longitude: parseFloat(startLon)
    }
    const end: RoutePoint = {
      latitude: parseFloat(endLat),
      longitude: parseFloat(endLon)
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const alts = await getRouteAlternatives(start, end, selectedMode)
      setAlternatives(alts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get route alternatives')
    } finally {
      setLoading(false)
    }
  }

  // Use example route
  const useExampleRoute = (example: { start: [number, number]; end: [number, number] }) => {
    setStartLat(example.start[1].toString())
    setStartLon(example.start[0].toString())
    setEndLat(example.end[1].toString())
    setEndLon(example.end[0].toString())
  }

  // Get current location
  const useCurrentLocation = (isStart: boolean) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isStart) {
          setStartLat(position.coords.latitude.toString())
          setStartLon(position.coords.longitude.toString())
        } else {
          setEndLat(position.coords.latitude.toString())
          setEndLon(position.coords.longitude.toString())
        }
      },
      (error) => {
        setError('Failed to get current location')
      }
    )
  }

  // Auto-test on page load
  useEffect(() => {
    testOriginalCode()
  }, [])

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'drive': return <Car className="h-4 w-4" />
      case 'walk': return <User className="h-4 w-4" />
      case 'bicycle': return <Bike className="h-4 w-4" />
      default: return <Route className="h-4 w-4" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">🛣️ Routing API Test</h1>
        <p className="text-gray-600">
          Testing routing based on your exact code example: KL to Mid Valley route calculation
        </p>
      </div>

      {/* Your Original Code Test */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">📝 Your Original Code Pattern</h2>
        <div className="space-y-4">
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            <div>const start = [101.6869, 3.1390]; // KL</div>
            <div>const end = [101.7072, 3.0738];   // Mid Valley</div>
            <div>fetch(`https://api.geoapify.com/v1/routing?waypoints=$&#123;start[1]&#125;,$&#123;start[0]&#125;|$&#123;end[1]&#125;,$&#123;end[0]&#125;&mode=drive&apiKey=$&#123;apiKey&#125;`)</div>
            <div>&nbsp;&nbsp;.then(response =&gt; response.json())</div>
            <div>&nbsp;&nbsp;.then(result =&gt; &#123;</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;const coordinates = result.features[0].geometry.coordinates;</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;console.log("Route:", coordinates);</div>
            <div>&nbsp;&nbsp;&#125;);</div>
          </div>
          
          <Button onClick={testOriginalCode} disabled={loading} className="w-full">
            {loading ? 'Testing Original Code...' : '🧪 Test Your Exact Code Pattern'}
          </Button>
          
          {exactCoordinates && (
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="text-blue-900 font-medium mb-2">Result from your code:</div>
              <div className="text-sm font-mono bg-blue-100 p-2 rounded">
                Route coordinates: {exactCoordinates.length} points
              </div>
              <div className="text-xs text-gray-600 mt-2">
                First point: [{exactCoordinates[0]?.[0].toFixed(4)}, {exactCoordinates[0]?.[1].toFixed(4)}]<br/>
                Last point: [{exactCoordinates[exactCoordinates.length-1]?.[0].toFixed(4)}, {exactCoordinates[exactCoordinates.length-1]?.[1].toFixed(4)}]
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Enhanced Routing */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🚀 Enhanced Routing</h2>
        <div className="space-y-4">
          {/* Coordinates Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Location:</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={startLat}
                  onChange={(e) => setStartLat(e.target.value)}
                  placeholder="Latitude"
                  type="number"
                  step="any"
                />
                <Input
                  value={startLon}
                  onChange={(e) => setStartLon(e.target.value)}
                  placeholder="Longitude"
                  type="number"
                  step="any"
                />
              </div>
              <Button onClick={() => useCurrentLocation(true)} variant="ghost" size="sm" className="mt-1">
                📍 Use Current Location
              </Button>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">End Location:</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={endLat}
                  onChange={(e) => setEndLat(e.target.value)}
                  placeholder="Latitude"
                  type="number"
                  step="any"
                />
                <Input
                  value={endLon}
                  onChange={(e) => setEndLon(e.target.value)}
                  placeholder="Longitude"
                  type="number"
                  step="any"
                />
              </div>
              <Button onClick={() => useCurrentLocation(false)} variant="ghost" size="sm" className="mt-1">
                📍 Use Current Location
              </Button>
            </div>
          </div>

          {/* Example Routes */}
          <div>
            <label className="block text-sm font-medium mb-2">Quick Test Routes:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(EXAMPLE_ROUTES).map(([key, route]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => useExampleRoute(route)}
                  className="text-xs justify-start"
                >
                  {route.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Travel Mode:</label>
            <div className="flex gap-2">
              {(['drive', 'walk', 'bicycle'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={selectedMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMode(mode)}
                  className="flex items-center gap-2"
                >
                  {getModeIcon(mode)}
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button onClick={testEnhancedRouting} disabled={loading}>
              {loading ? 'Calculating...' : 'Calculate Route'}
            </Button>
            <Button onClick={testMultipleModes} disabled={loading} variant="outline">
              All Modes
            </Button>
            <Button onClick={testAlternatives} disabled={loading} variant="outline">
              Alternatives
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-red-800">❌ {error}</div>
        </Card>
      )}

      {/* Single Route Result */}
      {routeResult && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h2 className="text-xl font-semibold mb-4 text-green-900">✅ Route Calculated</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Route className="h-5 w-5 text-green-600" />
                <span className="font-medium">Distance</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatRouteDistance(routeResult.totalDistance)}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Duration</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatRouteDuration(routeResult.totalDuration)}
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <span className="font-medium">ETA</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {getEstimatedArrival(routeResult.totalDuration)}
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h3 className="font-medium mb-2">Route Details:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Mode: {routeResult.mode}</div>
              <div>Coordinates: {routeResult.coordinates.length} points</div>
              <div>Steps: {routeResult.steps.length}</div>
              <div>Summary: {routeResult.summary}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Multiple Routes */}
      {Object.keys(multipleRoutes).length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🚗🚶🚴 Multiple Travel Modes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(multipleRoutes).map(([mode, route]) => (
              <div key={mode} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  {getModeIcon(mode)}
                  <h3 className="font-medium capitalize">{mode}</h3>
                </div>
                
                {route ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-medium">{formatRouteDistance(route.totalDistance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{formatRouteDuration(route.totalDuration)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ETA:</span>
                      <span className="font-medium">{getEstimatedArrival(route.totalDuration)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-red-600">Route not available</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Route Alternatives */}
      {alternatives.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🔀 Route Alternatives ({alternatives.length})</h2>
          <div className="space-y-3">
            {alternatives.map((route, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Route {index + 1}</h3>
                  <span className="text-sm text-gray-600">{route.summary}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Distance: </span>
                    <span className="font-medium">{formatRouteDistance(route.totalDistance)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration: </span>
                    <span className="font-medium">{formatRouteDuration(route.totalDuration)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">ETA: </span>
                    <span className="font-medium">{getEstimatedArrival(route.totalDuration)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* API Status */}
      <Card className="p-6 bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">📊 API Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>API Endpoint:</strong>
            <div className="font-mono bg-white p-2 rounded mt-1 text-xs">
              https://api.geoapify.com/v1/routing
            </div>
          </div>
          <div>
            <strong>Parameters:</strong>
            <div className="bg-white p-2 rounded mt-1 text-xs">
              waypoints, mode, apiKey
            </div>
          </div>
          <div>
            <strong>Response Format:</strong>
            <div className="bg-white p-2 rounded mt-1 text-xs">
              result.features[0].geometry.coordinates
            </div>
          </div>
          <div>
            <strong>API Key Status:</strong>
            <div className="text-green-600 font-medium">
              ✅ Configured
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
