'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { calculateRoute } from '@/lib/routing'
import dynamic from 'next/dynamic'

// Dynamic import for GeoapifyMap
const GeoapifyMap = dynamic(() => import('@/components/map/GeoapifyMap'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">Loading map...</div>
})

// Test autism centers around KL
const TEST_CENTERS = [
  {
    id: 'kl-hospital',
    name: 'Hospital Kuala Lumpur',
    type: 'diagnostic',
    address: 'Jalan Pahang, Kuala Lumpur',
    latitude: 3.1478,
    longitude: 101.7017,
    phone: '+60-3-2615-5555',
    description: 'Major public hospital with autism diagnostic services',
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'klcc-center',
    name: 'KLCC Autism Support Center',
    type: 'therapy',
    address: 'KLCC, Kuala Lumpur',
    latitude: 3.1578,
    longitude: 101.7123,
    phone: '+60-3-2382-2828',
    description: 'Therapy and support services for children with autism',
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mid-valley-clinic',
    name: 'Mid Valley Psychology Clinic',
    type: 'support',
    address: 'Mid Valley City, Kuala Lumpur',
    latitude: 3.0738,
    longitude: 101.7072,
    phone: '+60-3-2938-3838',
    description: 'Psychology and behavioral therapy clinic',
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export default function TestRouteColoringPage() {
  const [userLocation] = useState<[number, number]>([3.1390, 101.6869]) // KL City Center
  const [selectedCenter, setSelectedCenter] = useState(TEST_CENTERS[0])
  const [route, setRoute] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Calculate route to selected center
  const calculateRouteToCenter = async (center: any) => {
    setLoading(true)
    try {
      console.log('🛣️ Calculating route to:', center.name)
      
      const routeResult = await calculateRoute(
        { latitude: userLocation[0], longitude: userLocation[1] },
        { latitude: center.latitude, longitude: center.longitude },
        { mode: 'drive' }
      )

      if (routeResult) {
        console.log('✅ Route calculated:', routeResult.summary)
        setRoute(routeResult)
        setSelectedCenter(center)
      } else {
        console.log('❌ No route found')
        setRoute(null)
      }
    } catch (error) {
      console.error('❌ Route calculation failed:', error)
      setRoute(null)
    } finally {
      setLoading(false)
    }
  }

  // Auto-calculate route on page load
  useEffect(() => {
    calculateRouteToCenter(selectedCenter)
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">🛣️ Route Coloring Test</h1>
        <p className="text-gray-600">
          Testing colored route visualization to autism centers - click "🛣️ Route" buttons to see colored paths
        </p>
      </div>

      {/* Center Selection */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🏥 Select Autism Center</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEST_CENTERS.map((center) => (
            <div 
              key={center.id} 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedCenter.id === center.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => calculateRouteToCenter(center)}
            >
              <h3 className="font-semibold">{center.name}</h3>
              <p className="text-sm text-gray-600">{center.type}</p>
              <p className="text-xs text-gray-500 mt-1">{center.address}</p>
              
              <Button
                size="sm"
                variant="outline"
                className="mt-2 w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  calculateRouteToCenter(center)
                }}
                disabled={loading}
              >
                🛣️ {loading && selectedCenter.id === center.id ? 'Calculating...' : 'Show Route'}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Route Info */}
      {route && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">✅ Route to {selectedCenter.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded">
              <strong>Distance:</strong>
              <div className="text-lg font-bold text-blue-600">
                {(route.totalDistance / 1000).toFixed(1)} km
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <strong>Duration:</strong>
              <div className="text-lg font-bold text-green-600">
                {Math.round(route.totalDuration / 60)} min
              </div>
            </div>
            <div className="bg-white p-3 rounded">
              <strong>Route Points:</strong>
              <div className="text-lg font-bold text-purple-600">
                {route.coordinates.length}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Map with Route */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🗺️ Map with Colored Route</h2>
        <div className="h-96">
          <GeoapifyMap
            centers={TEST_CENTERS}
            userLocation={userLocation}
            route={route ? {
              coordinates: route.coordinates,
              summary: route.summary
            } : undefined}
            showRoute={!!route}
            className="h-full w-full"
            zoom={12}
          />
        </div>
        
        <div className="mt-4 text-sm text-gray-600 space-y-1">
          <div><strong>Expected:</strong> Blue route line with black shadow from your location to selected center</div>
          <div><strong>Your Location:</strong> Blue pulsing circle at KL City Center</div>
          <div><strong>Centers:</strong> Colored markers (D=Diagnostic, T=Therapy, S=Support)</div>
          <div><strong>Route:</strong> Thick blue line showing driving directions</div>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h2 className="text-xl font-semibold mb-4 text-yellow-900">📋 How to Test</h2>
        <div className="space-y-2 text-sm text-yellow-800">
          <div>1. <strong>Click center cards</strong> or "🛣️ Show Route" buttons to calculate routes</div>
          <div>2. <strong>Look for blue lines</strong> connecting your location to the selected center</div>
          <div>3. <strong>Check console</strong> for route calculation logs and coordinate data</div>
          <div>4. <strong>Try different centers</strong> to see routes to different locations</div>
          <div>5. <strong>Route should be visible</strong> as a thick blue line with shadow</div>
        </div>
      </Card>

      {/* Debug Info */}
      {route && (
        <Card className="p-4 bg-gray-50">
          <h3 className="font-semibold mb-2">🔍 Debug Info</h3>
          <div className="text-xs space-y-1">
            <div><strong>Route Coordinates (first 3):</strong></div>
            <pre className="bg-white p-2 rounded overflow-x-auto">
              {JSON.stringify(route.coordinates.slice(0, 3), null, 2)}
            </pre>
            <div><strong>Total Coordinates:</strong> {route.coordinates.length}</div>
            <div><strong>Summary:</strong> {route.summary}</div>
          </div>
        </Card>
      )}
    </div>
  )
}
