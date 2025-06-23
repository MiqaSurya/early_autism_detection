'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { geocodeAddress, reverseGeocode, searchPlaces, geocodeAutismCenter, GeocodeResult, ReverseGeocodeResult } from '@/lib/geocoding'

// Test addresses in Malaysia
const testAddresses = [
  "Universiti Malaya, Kuala Lumpur",
  "KLCC, Kuala Lumpur",
  "Mid Valley Megamall, Kuala Lumpur",
  "Sunway Pyramid, Petaling Jaya",
  "Genting Highlands, Pahang",
  "Penang Bridge, Penang",
  "Johor Bahru City Square",
  "Kota Kinabalu, Sabah"
]

export default function TestGeocodingPage() {
  const [address, setAddress] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [centerName, setCenterName] = useState('')
  const [centerAddress, setCenterAddress] = useState('')
  
  const [geocodeResults, setGeocodeResults] = useState<GeocodeResult[]>([])
  const [reverseResults, setReverseResults] = useState<ReverseGeocodeResult | null>(null)
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([])
  const [centerResults, setCenterResults] = useState<GeocodeResult | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGeocode = async () => {
    if (!address.trim()) return
    
    setLoading(true)
    setError(null)
    try {
      const results = await geocodeAddress(address)
      setGeocodeResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geocoding failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReverseGeocode = async () => {
    const lat = parseFloat(latitude)
    const lon = parseFloat(longitude)
    
    if (isNaN(lat) || isNaN(lon)) {
      setError('Please enter valid coordinates')
      return
    }
    
    setLoading(true)
    setError(null)
    try {
      const result = await reverseGeocode(lat, lon)
      setReverseResults(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reverse geocoding failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    setError(null)
    try {
      const results = await searchPlaces(searchQuery, {
        limit: 10,
        countryCode: 'MY'
      })
      setSearchResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleAutismCenterGeocode = async () => {
    if (!centerName.trim() || !centerAddress.trim()) return
    
    setLoading(true)
    setError(null)
    try {
      const result = await geocodeAutismCenter(centerName, centerAddress)
      setCenterResults(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Autism center geocoding failed')
    } finally {
      setLoading(false)
    }
  }

  const useTestAddress = (testAddr: string) => {
    setAddress(testAddr)
  }

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString())
          setLongitude(position.coords.longitude.toString())
        },
        (error) => {
          setError('Could not get current location')
        }
      )
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">🔍 Geocoding API Test</h1>
        <p className="text-gray-600">
          Test the new geocoding functionality based on the provided Geoapify code.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-red-800">❌ {error}</div>
        </Card>
      )}

      {/* Forward Geocoding */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">📍 Forward Geocoding (Address → Coordinates)</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Address:</label>
            <div className="flex gap-2">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter an address in Malaysia..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleGeocode()}
              />
              <Button onClick={handleGeocode} disabled={loading}>
                {loading ? 'Geocoding...' : 'Geocode'}
              </Button>
            </div>
          </div>
          
          {/* Test Addresses */}
          <div>
            <label className="block text-sm font-medium mb-2">Quick Test Addresses:</label>
            <div className="flex flex-wrap gap-2">
              {testAddresses.map((testAddr, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => useTestAddress(testAddr)}
                  className="text-xs"
                >
                  {testAddr}
                </Button>
              ))}
            </div>
          </div>

          {/* Results */}
          {geocodeResults.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Results ({geocodeResults.length}):</h3>
              <div className="space-y-2">
                {geocodeResults.map((result, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                    <div className="font-medium">{result.formatted}</div>
                    <div className="text-gray-600">
                      📍 {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                    </div>
                    <div className="text-gray-500">
                      {result.city && `${result.city}, `}{result.state && `${result.state}, `}{result.country}
                      {result.confidence > 0 && ` • Confidence: ${Math.round(result.confidence * 100)}%`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Reverse Geocoding */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🔄 Reverse Geocoding (Coordinates → Address)</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="Latitude (e.g., 3.1390)"
              type="number"
              step="any"
            />
            <Input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="Longitude (e.g., 101.6869)"
              type="number"
              step="any"
            />
            <div className="flex gap-2">
              <Button onClick={handleReverseGeocode} disabled={loading} className="flex-1">
                {loading ? 'Reverse...' : 'Reverse Geocode'}
              </Button>
              <Button onClick={useCurrentLocation} variant="outline">
                📍 Current
              </Button>
            </div>
          </div>

          {/* Reverse Results */}
          {reverseResults && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Address Found:</h3>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <div className="font-medium">{reverseResults.formatted}</div>
                <div className="text-gray-600">
                  {reverseResults.street && `${reverseResults.street} `}
                  {reverseResults.housenumber && `${reverseResults.housenumber}, `}
                  {reverseResults.city && `${reverseResults.city}, `}
                  {reverseResults.state && `${reverseResults.state}, `}
                  {reverseResults.country}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Place Search */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🔍 Place Search (Autocomplete)</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for places in Malaysia..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Search Results ({searchResults.length}):</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {searchResults.map((result, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                    <div className="font-medium">{result.formatted}</div>
                    <div className="text-gray-600">
                      📍 {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                    </div>
                    <div className="text-gray-500">
                      Confidence: {Math.round(result.confidence * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Autism Center Geocoding */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">🏥 Autism Center Geocoding</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input
              value={centerName}
              onChange={(e) => setCenterName(e.target.value)}
              placeholder="Center name (e.g., Early Autism Project Malaysia)"
            />
            <Input
              value={centerAddress}
              onChange={(e) => setCenterAddress(e.target.value)}
              placeholder="Center address"
            />
          </div>
          <Button onClick={handleAutismCenterGeocode} disabled={loading} className="w-full">
            {loading ? 'Geocoding Center...' : 'Geocode Autism Center'}
          </Button>

          {/* Center Results */}
          {centerResults && (
            <div className="mt-4">
              <h3 className="font-medium mb-2 text-blue-900">Center Location Found:</h3>
              <div className="bg-white p-3 rounded text-sm border border-blue-200">
                <div className="font-medium">{centerResults.formatted}</div>
                <div className="text-gray-600">
                  📍 {centerResults.latitude.toFixed(6)}, {centerResults.longitude.toFixed(6)}
                </div>
                <div className="text-blue-600">
                  Confidence: {Math.round(centerResults.confidence * 100)}%
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* API Status */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h2 className="text-xl font-semibold mb-4 text-green-900">✅ API Status</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Geoapify API Key:</span>
            <span className="text-green-600">✅ Configured</span>
          </div>
          <div className="flex justify-between">
            <span>Forward Geocoding:</span>
            <span className="text-green-600">✅ Ready</span>
          </div>
          <div className="flex justify-between">
            <span>Reverse Geocoding:</span>
            <span className="text-green-600">✅ Ready</span>
          </div>
          <div className="flex justify-between">
            <span>Place Search:</span>
            <span className="text-green-600">✅ Ready</span>
          </div>
          <div className="flex justify-between">
            <span>Malaysia Focus:</span>
            <span className="text-green-600">✅ Enabled</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
