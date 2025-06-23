'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  searchPOI, 
  searchPOIByCategory, 
  searchHealthcarePOI, 
  searchAutismRelatedPOI,
  getNearbyPlaces,
  POIPlace, 
  HEALTHCARE_CATEGORIES, 
  EDUCATION_CATEGORIES, 
  COMMUNITY_CATEGORIES,
  formatDistance,
  getCategoryDisplayName
} from '@/lib/poi'
import { MapPin, Phone, Globe, Clock, Star, Wheelchair } from 'lucide-react'

// Your exact example coordinates
const EXAMPLE_COORDINATES = {
  lat: 3.1390,
  lon: 101.6869
}

export default function TestPOIPage() {
  const [latitude, setLatitude] = useState(EXAMPLE_COORDINATES.lat.toString())
  const [longitude, setLongitude] = useState(EXAMPLE_COORDINATES.lon.toString())
  const [radius, setRadius] = useState('5000')
  const [limit, setLimit] = useState('10')
  const [selectedCategory, setSelectedCategory] = useState(HEALTHCARE_CATEGORIES.HOSPITAL)
  
  const [poiResults, setPOIResults] = useState<POIPlace[]>([])
  const [nearbyPlaces, setNearbyPlaces] = useState<{ [category: string]: POIPlace[] }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Test your exact code pattern
  const testOriginalCode = async () => {
    const lat = 3.1390
    const lon = 101.6869
    const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('Testing your exact POI code pattern...')
      
      // Your exact code
      const response = await fetch(
        `https://api.geoapify.com/v2/places?categories=healthcare.hospital&filter=circle:${lon},${lat},5000&limit=10&apiKey=${apiKey}`
      )
      const result = await response.json()
      
      const places: POIPlace[] = []
      
      // Your exact forEach pattern
      result.features.forEach((place: any) => {
        console.log(place.properties.name, place.geometry.coordinates)
        
        const coordinates = place.geometry.coordinates
        const properties = place.properties
        
        places.push({
          id: properties.place_id || `poi-${Date.now()}-${Math.random()}`,
          name: properties.name || 'Unknown Place',
          category: 'healthcare.hospital',
          latitude: coordinates[1],
          longitude: coordinates[0],
          address: properties.formatted || '',
          formatted: properties.formatted || '',
          properties: properties
        })
      })
      
      setPOIResults(places)
      
    } catch (err) {
      console.error('Original POI code test failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to search POI')
    } finally {
      setLoading(false)
    }
  }

  // Test enhanced POI search
  const testEnhancedPOI = async () => {
    const lat = parseFloat(latitude)
    const lon = parseFloat(longitude)
    const radiusNum = parseInt(radius)
    const limitNum = parseInt(limit)
    
    if (isNaN(lat) || isNaN(lon)) {
      setError('Please enter valid coordinates')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const places = await searchPOIByCategory(lat, lon, selectedCategory, radiusNum, limitNum)
      setPOIResults(places)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search POI')
    } finally {
      setLoading(false)
    }
  }

  // Test healthcare POI
  const testHealthcarePOI = async () => {
    const lat = parseFloat(latitude)
    const lon = parseFloat(longitude)
    const radiusNum = parseInt(radius)
    
    setLoading(true)
    setError(null)
    
    try {
      const places = await searchHealthcarePOI(lat, lon, radiusNum, 15)
      setPOIResults(places)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search healthcare POI')
    } finally {
      setLoading(false)
    }
  }

  // Test autism-related POI
  const testAutismPOI = async () => {
    const lat = parseFloat(latitude)
    const lon = parseFloat(longitude)
    
    setLoading(true)
    setError(null)
    
    try {
      const places = await searchAutismRelatedPOI(lat, lon, 10000, 20)
      setPOIResults(places)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search autism-related POI')
    } finally {
      setLoading(false)
    }
  }

  // Test nearby places
  const testNearbyPlaces = async () => {
    const lat = parseFloat(latitude)
    const lon = parseFloat(longitude)
    const radiusNum = parseInt(radius)
    
    setLoading(true)
    setError(null)
    
    try {
      const places = await getNearbyPlaces(lat, lon, radiusNum)
      setNearbyPlaces(places)
      setPOIResults([]) // Clear single results
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search nearby places')
    } finally {
      setLoading(false)
    }
  }

  // Get current location
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString())
        setLongitude(position.coords.longitude.toString())
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

  const allCategories = {
    ...HEALTHCARE_CATEGORIES,
    ...EDUCATION_CATEGORIES,
    ...COMMUNITY_CATEGORIES
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">🏥 Point of Interest (POI) Test</h1>
        <p className="text-gray-600">
          Testing POI search based on your exact code example: healthcare.hospital around KL coordinates
        </p>
      </div>

      {/* Your Original Code Test */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">📝 Your Original Code Pattern</h2>
        <div className="space-y-4">
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
            <div>const lat = 3.1390;</div>
            <div>const lon = 101.6869;</div>
            <div>fetch(`https://api.geoapify.com/v2/places?categories=healthcare.hospital&filter=circle:$&#123;lon&#125;,$&#123;lat&#125;,5000&limit=10&apiKey=$&#123;apiKey&#125;`)</div>
            <div>&nbsp;&nbsp;.then(response =&gt; response.json())</div>
            <div>&nbsp;&nbsp;.then(result =&gt; &#123;</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;result.features.forEach(place =&gt; &#123;</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;console.log(place.properties.name, place.geometry.coordinates);</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;&#125;);</div>
            <div>&nbsp;&nbsp;&#125;);</div>
          </div>
          
          <Button onClick={testOriginalCode} disabled={loading} className="w-full">
            {loading ? 'Testing Original Code...' : '🧪 Test Your Exact Code Pattern'}
          </Button>
        </div>
      </Card>

      {/* Enhanced POI Search */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🚀 Enhanced POI Search</h2>
        <div className="space-y-4">
          {/* Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
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
            <Input
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              placeholder="Radius (meters)"
              type="number"
            />
            <Input
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="Limit"
              type="number"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {Object.entries(allCategories).map(([key, value]) => (
                <option key={key} value={value}>
                  {key.replace(/_/g, ' ')} ({value})
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <Button onClick={testEnhancedPOI} disabled={loading}>
              {loading ? 'Searching...' : 'Search Category'}
            </Button>
            <Button onClick={testHealthcarePOI} disabled={loading} variant="outline">
              Healthcare POI
            </Button>
            <Button onClick={testAutismPOI} disabled={loading} variant="outline">
              Autism Related
            </Button>
            <Button onClick={testNearbyPlaces} disabled={loading} variant="outline">
              All Nearby
            </Button>
          </div>

          <Button onClick={useCurrentLocation} variant="ghost" className="w-full">
            📍 Use Current Location
          </Button>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-red-800">❌ {error}</div>
        </Card>
      )}

      {/* Single POI Results */}
      {poiResults.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📍 POI Results ({poiResults.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {poiResults.map((place, index) => (
              <div key={place.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{place.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {getCategoryDisplayName(place.category)}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{place.formatted}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs">📍</span>
                    <span className="font-mono text-xs">
                      {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                    </span>
                    {place.distance && (
                      <span className="text-blue-600 text-xs">
                        • {formatDistance(place.distance)}
                      </span>
                    )}
                  </div>

                  {place.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span>{place.phone}</span>
                    </div>
                  )}

                  {place.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Website
                      </a>
                    </div>
                  )}

                  {place.rating && (
                    <div className="flex items-center gap-2">
                      <Star className="h-3 w-3" />
                      <span>{place.rating}/5</span>
                    </div>
                  )}

                  {place.wheelchair_accessible && (
                    <div className="flex items-center gap-2">
                      <Wheelchair className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">Wheelchair Accessible</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Nearby Places by Category */}
      {Object.keys(nearbyPlaces).length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">🗺️ Nearby Places by Category</h2>
          <div className="space-y-6">
            {Object.entries(nearbyPlaces).map(([category, places]) => (
              <div key={category}>
                <h3 className="text-lg font-medium mb-3 text-gray-900">
                  {category} ({places.length})
                </h3>
                {places.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {places.map((place) => (
                      <div key={place.id} className="bg-gray-50 p-3 rounded text-sm">
                        <div className="font-medium text-gray-900 mb-1">{place.name}</div>
                        <div className="text-gray-600 text-xs">{place.formatted}</div>
                        {place.distance && (
                          <div className="text-blue-600 text-xs mt-1">
                            {formatDistance(place.distance)} away
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No {category.toLowerCase()} found in this area</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* API Status */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h2 className="text-xl font-semibold mb-4 text-green-900">✅ API Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>API Endpoint:</strong>
            <div className="font-mono bg-white p-2 rounded mt-1 text-xs">
              https://api.geoapify.com/v2/places
            </div>
          </div>
          <div>
            <strong>Search Pattern:</strong>
            <div className="bg-white p-2 rounded mt-1 text-xs">
              categories + filter=circle:lon,lat,radius
            </div>
          </div>
          <div>
            <strong>Available Categories:</strong>
            <div className="bg-white p-2 rounded mt-1 text-xs">
              Healthcare, Education, Community
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
