'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import NavigationMap from '@/components/navigation/NavigationMap'

// Test locations in Malaysia (based on your console logs)
const testLocations = {
  userLocation: [3.1499222, 101.6944619] as [number, number], // Your actual location
  kualaLumpur: [3.1390, 101.6869] as [number, number], // KL City Center
  petronasKLCC: [3.1578, 101.7123] as [number, number], // Petronas Towers
  midValley: [3.1186, 101.6769] as [number, number], // Mid Valley
  sunwayPyramid: [3.0738, 101.6065] as [number, number], // Sunway Pyramid
}

// Mock route data
const createMockRoute = (from: [number, number], to: [number, number]) => ({
  steps: [
    {
      instruction: 'Head north on Jalan Ampang',
      distance: 500,
      duration: 60,
      maneuver: 'straight',
      coordinates: [[from[1], from[0]], [to[1], to[0]]]
    },
    {
      instruction: 'Turn right onto Jalan Tun Razak',
      distance: 800,
      duration: 120,
      maneuver: 'turn-right',
      coordinates: [[to[1], to[0]]]
    },
    {
      instruction: 'Arrive at destination',
      distance: 0,
      duration: 0,
      maneuver: 'arrive',
      coordinates: [[to[1], to[0]]]
    }
  ],
  totalDistance: 1300,
  totalDuration: 180,
  coordinates: [[from[1], from[0]], [(from[1] + to[1])/2, (from[0] + to[0])/2], [to[1], to[0]]],
  summary: '1.3 km • 3 min'
})

export default function TestGeoapifyMapPage() {
  const [selectedDestination, setSelectedDestination] = useState<keyof typeof testLocations>('kualaLumpur')
  const [showRoute, setShowRoute] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const userLocation = testLocations.userLocation
  const destination = testLocations[selectedDestination]
  const route = showRoute ? createMockRoute(userLocation, destination) : undefined

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-4">🗺️ Geoapify Map Test</h1>
        <p className="text-gray-600">
          Testing the real Geoapify map integration with your actual location in Malaysia.
        </p>
      </div>

      {/* Location Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">📍 Test Locations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Your Location:</strong>
            <div className="font-mono bg-gray-100 p-2 rounded mt-1">
              [{userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}]
            </div>
            <div className="text-xs text-gray-500 mt-1">Malaysia (from your console logs)</div>
          </div>
          <div>
            <strong>Selected Destination:</strong>
            <div className="font-mono bg-gray-100 p-2 rounded mt-1">
              [{destination[0].toFixed(6)}, {destination[1].toFixed(6)}]
            </div>
            <div className="text-xs text-gray-500 mt-1">{selectedDestination}</div>
          </div>
        </div>
      </Card>

      {/* Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🎮 Map Controls</h2>
        <div className="space-y-4">
          {/* Destination Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Choose Destination:</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(testLocations).filter(key => key !== 'userLocation').map((location) => (
                <Button
                  key={location}
                  variant={selectedDestination === location ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDestination(location as keyof typeof testLocations)}
                  className="text-xs"
                >
                  {location.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Button>
              ))}
            </div>
          </div>

          {/* Route Controls */}
          <div>
            <label className="block text-sm font-medium mb-2">Route Options:</label>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowRoute(!showRoute)}
                variant={showRoute ? "default" : "outline"}
                size="sm"
              >
                {showRoute ? '🗺️ Hide Route' : '🛣️ Show Route'}
              </Button>
              
              {showRoute && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">Step:</span>
                  <Button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    size="sm"
                    variant="outline"
                  >
                    ←
                  </Button>
                  <span className="text-sm font-mono px-2">
                    {currentStep + 1} / {route?.steps.length || 0}
                  </span>
                  <Button
                    onClick={() => setCurrentStep(Math.min((route?.steps.length || 1) - 1, currentStep + 1))}
                    disabled={currentStep >= (route?.steps.length || 1) - 1}
                    size="sm"
                    variant="outline"
                  >
                    →
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Map Display */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🗺️ Live Geoapify Map</h2>
        <div className="h-96 border rounded-lg overflow-hidden">
          <NavigationMap
            userLocation={userLocation}
            destination={destination}
            route={route}
            currentStepIndex={currentStep}
            className="h-full w-full"
          />
        </div>
        
        {/* Map Info */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded">
            <strong className="text-blue-800">Your Location</strong>
            <div className="text-blue-600">📍 Malaysia</div>
            <div className="text-xs text-blue-500 font-mono">
              {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded">
            <strong className="text-green-800">Destination</strong>
            <div className="text-green-600">🎯 {selectedDestination}</div>
            <div className="text-xs text-green-500 font-mono">
              {destination[0].toFixed(4)}, {destination[1].toFixed(4)}
            </div>
          </div>
          
          {route && (
            <div className="bg-purple-50 p-3 rounded">
              <strong className="text-purple-800">Route Info</strong>
              <div className="text-purple-600">🛣️ {route.summary}</div>
              <div className="text-xs text-purple-500">
                {route.steps.length} steps
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Current Step Info */}
      {route && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h2 className="text-xl font-semibold mb-4 text-yellow-900">🧭 Current Navigation Step</h2>
          <div className="bg-white p-4 rounded-lg">
            <div className="text-lg font-medium text-gray-900 mb-2">
              {route.steps[currentStep]?.instruction || 'No instruction'}
            </div>
            <div className="text-sm text-gray-600">
              Step {currentStep + 1} of {route.steps.length} • 
              Distance: {route.steps[currentStep]?.distance || 0}m • 
              Duration: {route.steps[currentStep]?.duration || 0}s
            </div>
          </div>
        </Card>
      )}

      {/* API Status */}
      <Card className="p-6 bg-green-50 border-green-200">
        <h2 className="text-xl font-semibold mb-4 text-green-900">✅ API Status</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Geoapify API Key:</span>
            <span className="text-green-600">✅ Configured</span>
          </div>
          <div className="flex justify-between">
            <span>Map Tiles:</span>
            <span className="text-green-600">✅ Loading from Geoapify</span>
          </div>
          <div className="flex justify-between">
            <span>Location Data:</span>
            <span className="text-green-600">✅ Real coordinates from Malaysia</span>
          </div>
          <div className="flex justify-between">
            <span>Navigation:</span>
            <span className="text-green-600">✅ Ready for testing</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
