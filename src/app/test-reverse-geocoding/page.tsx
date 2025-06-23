'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { reverseGeocode } from '@/lib/geocoding'

// Your exact example coordinates
const EXAMPLE_COORDINATES = {
  lat: 3.1390,
  lon: 101.6869
}

// Test coordinates around Malaysia
const TEST_COORDINATES = [
  { name: "KL City Center (Your Example)", lat: 3.1390, lon: 101.6869 },
  { name: "KLCC Petronas Towers", lat: 3.1578, lon: 101.7123 },
  { name: "Universiti Malaya", lat: 3.1251, lon: 101.6571 },
  { name: "Mid Valley Megamall", lat: 3.1186, lon: 101.6769 },
  { name: "Sunway Pyramid", lat: 3.0738, lon: 101.6065 },
  { name: "Genting Highlands", lat: 3.4227, lon: 101.7933 },
  { name: "Penang Georgetown", lat: 5.4164, lon: 100.3327 },
  { name: "Johor Bahru", lat: 1.4927, lon: 103.7414 }
]

export default function TestReverseGeocodingPage() {
  const [latitude, setLatitude] = useState(EXAMPLE_COORDINATES.lat.toString())
  const [longitude, setLongitude] = useState(EXAMPLE_COORDINATES.lon.toString())
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawApiResult, setRawApiResult] = useState<any>(null)

  // Test your exact code pattern
  const testOriginalCode = async () => {
    const lat = 3.1390
    const lon = 101.6869
    const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('Testing your exact code pattern...')
      
      const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`)
      const result = await response.json()
      
      console.log("Alamat:", result.features[0].properties.formatted)
      
      setRawApiResult(result)
      setResult(result.features[0].properties.formatted)
      
    } catch (err) {
      console.error('Original code test failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to reverse geocode')
    } finally {
      setLoading(false)
    }
  }

  // Test with our enhanced function
  const testEnhancedFunction = async () => {
    const lat = parseFloat(latitude)
    const lon = parseFloat(longitude)
    
    if (isNaN(lat) || isNaN(lon)) {
      setError('Please enter valid coordinates')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('Testing enhanced reverse geocoding function...')
      
      const result = await reverseGeocode(lat, lon)
      
      if (result) {
        console.log("Enhanced result:", result)
        setResult(result.formatted)
        setRawApiResult(result)
      } else {
        setError('No address found for these coordinates')
      }
      
    } catch (err) {
      console.error('Enhanced function test failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to reverse geocode')
    } finally {
      setLoading(false)
    }
  }

  // Get current location and reverse geocode
  const testCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lon = position.coords.longitude
        
        setLatitude(lat.toString())
        setLongitude(lon.toString())
        
        try {
          const result = await reverseGeocode(lat, lon)
          if (result) {
            setResult(result.formatted)
            setRawApiResult(result)
          }
        } catch (err) {
          setError('Failed to get address for current location')
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        setError('Failed to get current location')
        setLoading(false)
      }
    )
  }

  // Use test coordinates
  const useTestCoordinates = (coords: { lat: number; lon: number }) => {
    setLatitude(coords.lat.toString())
    setLongitude(coords.lon.toString())
  }

  // Auto-test on page load
  useEffect(() => {
    testOriginalCode()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">🔄 Reverse Geocoding Test</h1>
        <p className="text-gray-600">
          Testing reverse geocoding based on your exact code example: lat=3.1390, lon=101.6869
        </p>
      </div>

      {/* Your Original Code Test */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">📝 Your Original Code Pattern</h2>
        <div className="space-y-4">
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            <div>const lat = 3.1390;</div>
            <div>const lon = 101.6869;</div>
            <div>fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=$&#123;lat&#125;&lon=$&#123;lon&#125;&apiKey=YOUR_API_KEY`)</div>
            <div>&nbsp;&nbsp;.then(response =&gt; response.json())</div>
            <div>&nbsp;&nbsp;.then(result =&gt; &#123;</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;console.log("Alamat:", result.features[0].properties.formatted);</div>
            <div>&nbsp;&nbsp;&#125;);</div>
          </div>
          
          <Button onClick={testOriginalCode} disabled={loading} className="w-full">
            {loading ? 'Testing Original Code...' : '🧪 Test Your Exact Code Pattern'}
          </Button>
          
          {result && (
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="text-blue-900 font-medium mb-2">Result from your code:</div>
              <div className="text-lg font-mono bg-blue-100 p-2 rounded">
                "Alamat: {result}"
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Enhanced Function Test */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🚀 Enhanced Reverse Geocoding</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Latitude"
              type="number"
              step="any"
            />
            <Input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Longitude"
              type="number"
              step="any"
            />
            <Button onClick={testEnhancedFunction} disabled={loading}>
              {loading ? 'Reverse Geocoding...' : 'Get Address'}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={testCurrentLocation} disabled={loading} variant="outline">
              📍 Use Current Location
            </Button>
          </div>

          {/* Test Coordinates */}
          <div>
            <label className="block text-sm font-medium mb-2">Quick Test Coordinates:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {TEST_COORDINATES.map((coord, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => useTestCoordinates(coord)}
                  className="text-xs justify-start"
                >
                  <span className="font-medium">{coord.name}</span>
                  <span className="ml-2 text-gray-500">
                    {coord.lat.toFixed(4)}, {coord.lon.toFixed(4)}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Results Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-red-800">❌ {error}</div>
        </Card>
      )}

      {result && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h2 className="text-xl font-semibold mb-4 text-green-900">✅ Address Found</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-green-700 mb-1">Formatted Address:</div>
              <div className="text-lg font-medium bg-white p-3 rounded border">
                {result}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-green-700 mb-1">Coordinates:</div>
              <div className="font-mono bg-white p-3 rounded border">
                {latitude}, {longitude}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Raw API Response */}
      {rawApiResult && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🔍 Raw API Response</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto max-h-96">
            <pre>{JSON.stringify(rawApiResult, null, 2)}</pre>
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
              https://api.geoapify.com/v1/geocode/reverse
            </div>
          </div>
          <div>
            <strong>Parameters:</strong>
            <div className="bg-white p-2 rounded mt-1 text-xs">
              lat, lon, apiKey
            </div>
          </div>
          <div>
            <strong>Response Format:</strong>
            <div className="bg-white p-2 rounded mt-1 text-xs">
              result.features[0].properties.formatted
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
