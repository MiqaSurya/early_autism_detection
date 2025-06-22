'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Dynamic import for map to prevent SSR issues
const Map = dynamic(() => import('@/components/map/map'), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full bg-gray-200 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  )
});

export default function TestMapPage() {
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.7589, -73.9851]); // NYC
  const [markers, setMarkers] = useState([
    {
      position: [40.7589, -73.9851] as [number, number],
      popup: (
        <div className="p-2">
          <h3 className="font-semibold">Test Marker</h3>
          <p className="text-sm text-gray-600">This is a test marker in NYC</p>
        </div>
      )
    }
  ]);

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    console.log('Map clicked at:', latlng);
    // Add a new marker where clicked
    setMarkers(prev => [...prev, {
      position: [latlng.lat, latlng.lng] as [number, number],
      popup: (
        <div className="p-2">
          <h3 className="font-semibold">Clicked Location</h3>
          <p className="text-sm text-gray-600">
            Lat: {latlng.lat.toFixed(4)}, Lng: {latlng.lng.toFixed(4)}
          </p>
        </div>
      )
    }]);
  };

  const moveToLondon = () => {
    setMapCenter([51.505, -0.09]);
  };

  const moveToTokyo = () => {
    setMapCenter([35.6762, 139.6503]);
  };

  const clearMarkers = () => {
    setMarkers([]);
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Map Test Page</h1>
        <p className="text-gray-600">
          This page tests the map functionality. Click on the map to add markers.
        </p>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Map Controls</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={moveToLondon}>
            Move to London
          </Button>
          <Button onClick={moveToTokyo}>
            Move to Tokyo
          </Button>
          <Button variant="outline" onClick={clearMarkers}>
            Clear Markers
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Interactive Map</h2>
        <div className="h-96 w-full rounded-lg overflow-hidden">
          <Map
            center={mapCenter}
            zoom={13}
            markers={markers}
            onClick={handleMapClick}
            showUserLocation={true}
            className="h-full w-full"
          />
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>• Click anywhere on the map to add a marker</p>
          <p>• The blue marker shows your current location (if permission granted)</p>
          <p>• Use the controls above to test map navigation</p>
          <p>• Total markers: {markers.length}</p>
        </div>
      </Card>
    </div>
  );
}
