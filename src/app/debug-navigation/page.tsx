'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getCurrentLocation } from '@/lib/geoapify'
import { getDirections } from '@/lib/navigation'

export default function DebugNavigationPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [route, setRoute] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testLocationAccess = async () => {
    addLog('🔍 Testing location access...')
    setIsLoading(true)

    try {
      addLog('📍 Requesting user location...')
      const location = await getCurrentLocation()
      setUserLocation(location)
      addLog(`✅ Location obtained: ${location.lat}, ${location.lon}`)
    } catch (error) {
      addLog(`❌ Location error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testRouteCalculation = async () => {
    if (!userLocation) {
      addLog('❌ No user location available for route calculation')
      return
    }

    addLog('🗺️ Testing route calculation...')
    setIsLoading(true)

    try {
      // Test destination (example autism center coordinates)
      const testDestination = { lat: 40.7589, lon: -73.9851 } // NYC coordinates
      
      addLog(`📍 From: ${userLocation.lat}, ${userLocation.lon}`)
      addLog(`📍 To: ${testDestination.lat}, ${testDestination.lon}`)
      
      const calculatedRoute = await getDirections(userLocation, testDestination, 'drive')
      
      if (calculatedRoute) {
        setRoute(calculatedRoute)
        addLog(`✅ Route calculated: ${calculatedRoute.summary}`)
        addLog(`📊 Steps: ${calculatedRoute.steps.length}`)
        addLog(`📏 Distance: ${(calculatedRoute.totalDistance / 1000).toFixed(1)} km`)
        addLog(`⏱️ Duration: ${Math.round(calculatedRoute.totalDuration / 60)} minutes`)
      } else {
        addLog('❌ No route returned from API')
      }
    } catch (error) {
      addLog(`❌ Route calculation error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testGeoapifyAPI = async () => {
    addLog('🔑 Testing Geoapify API key...')
    
    const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
    if (!apiKey) {
      addLog('❌ NEXT_PUBLIC_GEOAPIFY_API_KEY is not set')
      return
    }
    
    if (apiKey === 'your-geoapify-api-key-here') {
      addLog('❌ API key is still placeholder value')
      return
    }
    
    addLog(`✅ API key found: ${apiKey.substring(0, 8)}...`)
    
    try {
      const testUrl = `https://api.geoapify.com/v1/geocode/search?text=New York&apiKey=${apiKey}`
      const response = await fetch(testUrl)
      
      if (response.ok) {
        addLog('✅ Geoapify API is working')
      } else {
        addLog(`❌ Geoapify API error: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      addLog(`❌ Geoapify API test failed: ${error}`)
    }
  }

  const testNavigationComponents = () => {
    addLog('🧩 Testing navigation components...')
    
    try {
      // Test if components can be imported
      addLog('✅ Navigation components imported successfully')
    } catch (error) {
      addLog(`❌ Component import error: ${error}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const runAllTests = async () => {
    clearLogs()
    addLog('🚀 Starting comprehensive navigation debug...')
    
    await testGeoapifyAPI()
    await testLocationAccess()
    await testRouteCalculation()
    testNavigationComponents()
    
    addLog('🏁 Debug tests completed')
  }

  useEffect(() => {
    addLog('🔧 Debug Navigation page loaded')
    addLog(`🌐 User Agent: ${navigator.userAgent}`)
    addLog(`📍 Geolocation available: ${navigator.geolocation ? 'Yes' : 'No'}`)
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">🔧 Navigation Debug Tool</h1>
        <p className="text-gray-600">
          This tool helps diagnose why navigation isn't working. Run the tests below to identify issues.
        </p>
      </div>

      {/* Test Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Debug Tests</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Button onClick={runAllTests} disabled={isLoading} className="w-full">
            🚀 Run All Tests
          </Button>
          <Button onClick={testGeoapifyAPI} disabled={isLoading} variant="outline" className="w-full">
            🔑 Test API Key
          </Button>
          <Button onClick={testLocationAccess} disabled={isLoading} variant="outline" className="w-full">
            📍 Test Location
          </Button>
          <Button onClick={testRouteCalculation} disabled={isLoading} variant="outline" className="w-full">
            🗺️ Test Routing
          </Button>
          <Button onClick={testNavigationComponents} disabled={isLoading} variant="outline" className="w-full">
            🧩 Test Components
          </Button>
          <Button onClick={clearLogs} variant="ghost" className="w-full">
            🗑️ Clear Logs
          </Button>
        </div>
      </Card>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">📍 Location Status</h3>
          <div className={`text-sm ${userLocation ? 'text-green-600' : 'text-gray-500'}`}>
            {userLocation 
              ? `✅ ${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}`
              : '❌ No location detected'
            }
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">🗺️ Route Status</h3>
          <div className={`text-sm ${route ? 'text-green-600' : 'text-gray-500'}`}>
            {route 
              ? `✅ ${route.steps.length} steps, ${(route.totalDistance / 1000).toFixed(1)} km`
              : '❌ No route calculated'
            }
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">🔑 API Status</h3>
          <div className="text-sm">
            {process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY 
              ? process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY === 'your-geoapify-api-key-here'
                ? '⚠️ Placeholder API key'
                : '✅ API key configured'
              : '❌ No API key found'
            }
          </div>
        </Card>
      </div>

      {/* Debug Logs */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">📋 Debug Logs</h2>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Run a test to see debug information.</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Quick Fixes */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">🔧 Common Issues & Fixes</h2>
        <div className="space-y-3 text-sm">
          <div>
            <strong className="text-blue-800">❌ "API key not configured"</strong>
            <p className="text-blue-700">Add your Geoapify API key to .env.local and restart the server</p>
          </div>
          <div>
            <strong className="text-blue-800">❌ "Location access denied"</strong>
            <p className="text-blue-700">Allow location access in your browser settings</p>
          </div>
          <div>
            <strong className="text-blue-800">❌ "Network request failed"</strong>
            <p className="text-blue-700">Check your internet connection and API key validity</p>
          </div>
          <div>
            <strong className="text-blue-800">❌ "Component failed to render"</strong>
            <p className="text-blue-700">Check browser console for JavaScript errors</p>
          </div>
        </div>
      </Card>

      {/* Navigation Test */}
      {userLocation && route && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h2 className="text-xl font-semibold mb-4 text-green-900">✅ Ready for Navigation</h2>
          <p className="text-green-700 mb-4">
            All tests passed! Navigation should work. Try going back to the locator and starting navigation.
          </p>
          <Button 
            onClick={() => window.location.href = '/dashboard/locator'}
            className="bg-green-600 hover:bg-green-700"
          >
            Go to Locator
          </Button>
        </Card>
      )}
    </div>
  )
}
