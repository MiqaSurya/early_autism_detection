'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { geocodeAddress, getCurrentLocation, getAutocompleteSuggestions } from '@/lib/geoapify'

export default function TestGeoapifyPage() {
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid'>('checking')
  const [testAddress, setTestAddress] = useState('')
  const [geocodeResult, setGeocodeResult] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if API key is configured
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
    if (apiKey && apiKey !== 'your-geoapify-api-key-here') {
      setApiKeyStatus('valid')
    } else {
      setApiKeyStatus('invalid')
    }
  }, [])

  // Test geocoding
  const testGeocode = async () => {
    if (!testAddress) return
    
    setLoading(true)
    setError(null)
    try {
      const results = await geocodeAddress(testAddress)
      setGeocodeResult(results[0] || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geocoding failed')
    } finally {
      setLoading(false)
    }
  }

  // Test autocomplete
  const testAutocomplete = async () => {
    if (!testAddress || testAddress.length < 3) {
      setSuggestions([])
      return
    }
    
    try {
      const results = await getAutocompleteSuggestions(testAddress)
      setSuggestions(results.slice(0, 5)) // Show first 5 suggestions
    } catch (err) {
      console.error('Autocomplete error:', err)
    }
  }

  // Test current location
  const testCurrentLocation = async () => {
    setLoading(true)
    setError(null)
    try {
      const location = await getCurrentLocation()
      setUserLocation(location)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Location access failed')
    } finally {
      setLoading(false)
    }
  }

  // Auto-test autocomplete as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      testAutocomplete()
    }, 300)
    return () => clearTimeout(timer)
  }, [testAddress])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">🗺️ Geoapify Integration Test</h1>
        <p className="text-gray-600">
          This page tests your Geoapify API integration to ensure everything is working correctly.
        </p>
      </div>

      {/* API Key Status */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">API Key Status</h2>
        <div className="flex items-center gap-3">
          {apiKeyStatus === 'checking' && (
            <div className="text-yellow-600">🔄 Checking API key...</div>
          )}
          {apiKeyStatus === 'valid' && (
            <div className="text-green-600">✅ API key is configured</div>
          )}
          {apiKeyStatus === 'invalid' && (
            <div className="text-red-600">❌ API key not found or invalid</div>
          )}
        </div>
        {apiKeyStatus === 'invalid' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm">
            <p><strong>Fix:</strong> Add your Geoapify API key to <code>.env.local</code>:</p>
            <code className="block mt-2 bg-gray-100 p-2 rounded">
              NEXT_PUBLIC_GEOAPIFY_API_KEY=your-actual-api-key
            </code>
            <p className="mt-2">Then restart your development server.</p>
          </div>
        )}
      </div>

      {/* Address Search Test */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Address Search & Geocoding Test</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={testAddress}
              onChange={(e) => setTestAddress(e.target.value)}
              placeholder="Enter an address (e.g., 1600 Amphitheatre Parkway, Mountain View, CA)"
              className="flex-1"
            />
            <Button onClick={testGeocode} disabled={loading || !testAddress}>
              {loading ? 'Testing...' : 'Test Geocode'}
            </Button>
          </div>

          {/* Autocomplete Suggestions */}
          {suggestions.length > 0 && (
            <div className="border rounded-lg p-3">
              <h3 className="font-medium mb-2">Autocomplete Suggestions:</h3>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="text-sm p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    onClick={() => setTestAddress(suggestion.display_name)}
                  >
                    📍 {suggestion.display_name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Geocoding Result */}
          {geocodeResult && (
            <div className="border rounded-lg p-3 bg-green-50">
              <h3 className="font-medium mb-2 text-green-800">✅ Geocoding Successful:</h3>
              <div className="text-sm space-y-1">
                <div><strong>Address:</strong> {geocodeResult.display_name}</div>
                <div><strong>Coordinates:</strong> {geocodeResult.lat}, {geocodeResult.lon}</div>
                <div><strong>Place ID:</strong> {geocodeResult.place_id}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Location Test */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Current Location Test</h2>
        <div className="space-y-4">
          <Button onClick={testCurrentLocation} disabled={loading}>
            {loading ? 'Getting Location...' : '📍 Get My Current Location'}
          </Button>

          {userLocation && (
            <div className="border rounded-lg p-3 bg-blue-50">
              <h3 className="font-medium mb-2 text-blue-800">✅ Location Detected:</h3>
              <div className="text-sm space-y-1">
                <div><strong>Latitude:</strong> {userLocation.lat}</div>
                <div><strong>Longitude:</strong> {userLocation.lon}</div>
                <div>
                  <strong>Google Maps:</strong>{' '}
                  <a
                    href={`https://www.google.com/maps/@${userLocation.lat},${userLocation.lon},15z`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View on Google Maps
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800 mb-2">❌ Error:</h3>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">🎉 Next Steps</h2>
        <div className="space-y-2 text-sm">
          <p>✅ If all tests pass, your Geoapify integration is working perfectly!</p>
          <p>✅ Visit <strong>/dashboard/locator</strong> to see the full autism center locator</p>
          <p>✅ The locator now uses Geoapify for maps, search, and geocoding</p>
          <p>✅ You can delete this test page once everything is working</p>
        </div>
      </div>
    </div>
  )
}
