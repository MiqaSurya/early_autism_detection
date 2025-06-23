'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function TestStaticMapPage() {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showRoute, setShowRoute] = useState(true)

  useEffect(() => {
    // Load Leaflet dynamically
    const loadMap = async () => {
      try {
        // Import Leaflet
        const L = (await import('leaflet')).default
        
        // Import React Leaflet components
        const { MapContainer, TileLayer, Marker, Polyline } = await import('react-leaflet')
        
        console.log('✅ Leaflet loaded:', L)
        console.log('✅ React Leaflet loaded:', { MapContainer, TileLayer, Marker, Polyline })
        
        setMapLoaded(true)
      } catch (error) {
        console.error('❌ Failed to load Leaflet:', error)
      }
    }

    loadMap()
  }, [])

  // Test coordinates
  const testRoute = [
    [3.1390, 101.6869], // KL
    [3.1200, 101.6900],
    [3.1000, 101.7000],
    [3.0900, 101.7050],
    [3.0738, 101.7072]  // Mid Valley
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">🗺️ Static Map Test</h1>
        <p className="text-gray-600">
          Testing if Leaflet loads properly and can render basic polylines
        </p>
      </div>

      {/* Loading Status */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full ${mapLoaded ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{mapLoaded ? '✅ Leaflet Loaded Successfully' : '⏳ Loading Leaflet...'}</span>
          <Button onClick={() => setShowRoute(!showRoute)} disabled={!mapLoaded}>
            {showRoute ? 'Hide Route' : 'Show Route'}
          </Button>
        </div>
      </Card>

      {/* Map Container */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Map Test</h3>
        <div id="map-container" className="h-96 w-full bg-gray-200 rounded-lg">
          {mapLoaded ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl mb-2">🗺️</div>
                <div>Map should load here</div>
                <div className="text-sm text-gray-600 mt-2">
                  If you see this, React Leaflet components aren't rendering
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl mb-2">⏳</div>
                <div>Loading Leaflet...</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Manual Map Creation */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Manual Leaflet Map</h3>
        <div id="manual-map" className="h-96 w-full bg-gray-200 rounded-lg"></div>
        <Button 
          onClick={async () => {
            try {
              const L = (await import('leaflet')).default
              
              // Create map manually
              const map = L.map('manual-map').setView([3.1064, 101.6970], 13)
              
              // Add tile layer
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
              }).addTo(map)
              
              // Add markers
              L.marker([3.1390, 101.6869]).addTo(map).bindPopup('Start: KL')
              L.marker([3.0738, 101.7072]).addTo(map).bindPopup('End: Mid Valley')
              
              // Add polyline
              const polyline = L.polyline(testRoute, {
                color: 'red',
                weight: 8,
                opacity: 1.0
              }).addTo(map)
              
              console.log('✅ Manual map created with polyline:', polyline)
              
            } catch (error) {
              console.error('❌ Manual map creation failed:', error)
            }
          }}
          className="mt-4"
        >
          Create Manual Map
        </Button>
      </Card>

      {/* Debug Info */}
      <Card className="p-4 bg-gray-50">
        <h3 className="font-semibold mb-2">Debug Information</h3>
        <div className="text-sm space-y-2">
          <div><strong>Leaflet Status:</strong> {mapLoaded ? 'Loaded' : 'Loading...'}</div>
          <div><strong>Test Route:</strong> {testRoute.length} coordinates</div>
          <div><strong>Expected:</strong> Red line connecting KL to Mid Valley</div>
          <div><strong>Browser Console:</strong> Check for Leaflet loading logs</div>
        </div>
        
        <div className="mt-4">
          <strong>Test Route Coordinates:</strong>
          <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
            {JSON.stringify(testRoute, null, 2)}
          </pre>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-4 bg-yellow-50">
        <h3 className="font-semibold mb-2">What Should Happen:</h3>
        <div className="text-sm space-y-1">
          <div>1. Leaflet should load (green dot)</div>
          <div>2. Click "Create Manual Map" to test basic Leaflet functionality</div>
          <div>3. You should see a map with two markers and a red line</div>
          <div>4. If no red line appears, there's a fundamental Polyline issue</div>
          <div>5. Check browser console for any Leaflet errors</div>
        </div>
      </Card>
    </div>
  )
}
