'use client';

import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

// Dynamically import the Map component with SSR disabled
// This is necessary because Leaflet requires the window object
const Map = dynamic(() => import('@/components/map/map'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-gray-200 animate-pulse rounded-md" />
});

export default function MapExamplePage() {
  // Example locations
  const markers = [
    {
      position: [51.505, -0.09] as [number, number],
      popup: "London - Example Location"
    },
    {
      position: [51.51, -0.1] as [number, number],
      popup: "Another nearby location"
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="outline">← Back to Dashboard</Button>
        </Link>
      </div>
      
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-2">OpenStreetMap with Leaflet Example</h2>
          <p className="text-gray-500 mb-6">
            This is a demonstration of the OpenStreetMap integration using Leaflet
          </p>
          <Map 
            center={[51.505, -0.09]} 
            zoom={13} 
            markers={markers} 
            height="500px"
            showUserLocation={true}
          />
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <h3 className="font-medium text-blue-800">Location Detection</h3>
            <p className="text-sm text-blue-600 mt-1">This map automatically attempts to detect your location. Click the location button in the top-left corner to re-detect your position.</p>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Map data © OpenStreetMap contributors
          </div>
        </div>
      </Card>
    </div>
  );
}
