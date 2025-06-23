'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

export default function TestPolylinePage() {
  const [showRoute, setShowRoute] = useState(true)

  // Simple test coordinates - KL to Mid Valley
  const startPoint: [number, number] = [3.1390, 101.6869] // [lat, lon] for Leaflet
  const endPoint: [number, number] = [3.0738, 101.7072]   // [lat, lon] for Leaflet
  
  // Simple straight line route for testing
  const testRoute: [number, number][] = [
    [3.1390, 101.6869], // Start - KL
    [3.1200, 101.6900], // Waypoint 1
    [3.1000, 101.7000], // Waypoint 2
    [3.0900, 101.7050], // Waypoint 3
    [3.0738, 101.7072]  // End - Mid Valley
  ]

  // More complex zigzag route for testing
  const zigzagRoute: [number, number][] = [
    [3.1390, 101.6869], // Start
    [3.1350, 101.6900], // Right
    [3.1300, 101.6850], // Left
    [3.1250, 101.6950], // Right
    [3.1200, 101.6900], // Left
    [3.1150, 101.7000], // Right
    [3.1100, 101.6950], // Left
    [3.1000, 101.7050], // Right
    [3.0900, 101.7000], // Left
    [3.0800, 101.7100], // Right
    [3.0738, 101.7072]  // End
  ]

  const mapCenter: [number, number] = [3.1064, 101.6970] // Center between start and end

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">🧪 Polyline Test</h1>
        <p className="text-gray-600">
          Testing if Polyline component works at all - debugging route visualization
        </p>
      </div>

      {/* Controls */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <Button 
            onClick={() => setShowRoute(!showRoute)}
            variant={showRoute ? "default" : "outline"}
          >
            {showRoute ? "Hide Route" : "Show Route"}
          </Button>
          <span className="text-sm text-gray-600">
            Toggle to see if Polyline appears/disappears
          </span>
        </div>
      </Card>

      {/* Test Info */}
      <Card className="p-4 bg-blue-50">
        <h3 className="font-semibold mb-2">Test Details:</h3>
        <div className="text-sm space-y-1">
          <div><strong>Start:</strong> KL City Center (3.1390, 101.6869)</div>
          <div><strong>End:</strong> Mid Valley (3.0738, 101.7072)</div>
          <div><strong>Route Points:</strong> {testRoute.length} coordinates</div>
          <div><strong>Expected:</strong> Thick red line connecting the points</div>
        </div>
      </Card>

      {/* Map */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Map with Test Route</h3>
        <div className="h-96 w-full">
          {typeof window !== 'undefined' && (
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg"
            >
              {/* Tile Layer */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Start Marker */}
              <Marker position={startPoint} />
              
              {/* End Marker */}
              <Marker position={endPoint} />

              {/* Test Route - Simple */}
              {showRoute && (
                <Polyline
                  positions={testRoute}
                  color="red"
                  weight={8}
                  opacity={1.0}
                />
              )}

              {/* Test Route - Zigzag (different color) */}
              {showRoute && (
                <Polyline
                  positions={zigzagRoute}
                  color="blue"
                  weight={6}
                  opacity={0.7}
                  dashArray="10, 5"
                />
              )}
            </MapContainer>
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <div><strong>Red Line:</strong> Simple direct route (thick, solid)</div>
          <div><strong>Blue Line:</strong> Zigzag route (thinner, dashed)</div>
          <div>If you don't see any lines, there's an issue with Polyline rendering</div>
        </div>
      </Card>

      {/* Coordinate Debug */}
      <Card className="p-4 bg-gray-50">
        <h3 className="font-semibold mb-2">Coordinate Debug:</h3>
        <div className="text-xs space-y-2">
          <div>
            <strong>Test Route Coordinates:</strong>
            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto">
              {JSON.stringify(testRoute, null, 2)}
            </pre>
          </div>
          <div>
            <strong>Format:</strong> [latitude, longitude] - correct for Leaflet
          </div>
          <div>
            <strong>Bounds:</strong> Lat: 3.0738 to 3.1390, Lon: 101.6869 to 101.7072
          </div>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-4 bg-yellow-50">
        <h3 className="font-semibold mb-2">What You Should See:</h3>
        <div className="text-sm space-y-1">
          <div>1. Two markers: one at start (KL), one at end (Mid Valley)</div>
          <div>2. Red thick line: Simple route connecting waypoints</div>
          <div>3. Blue dashed line: Zigzag route with more waypoints</div>
          <div>4. Toggle button should make lines appear/disappear</div>
          <div>5. If no lines appear, Polyline component has an issue</div>
        </div>
      </Card>
    </div>
  )
}
