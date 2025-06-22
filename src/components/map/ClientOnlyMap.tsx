'use client';

import { useEffect, useState } from 'react';

export interface MapMarker {
  position: [number, number];
  popup?: React.ReactNode;
}

export interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  height?: string;
  width?: string;
  className?: string;
  onClick?: (latlng: { lat: number; lng: number }) => void;
  showUserLocation?: boolean;
  userLocationAccuracy?: number;
}

// This component will only render on the client side
export default function ClientOnlyMap({ 
  center = [51.505, -0.09],
  zoom = 13,
  markers = [],
  height = '400px',
  width = '100%',
  className = '',
  onClick,
  showUserLocation = true
}: MapProps) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<MapProps> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load the map component on the client side
    if (typeof window !== 'undefined') {
      import('./MapComponent')
        .then((mod) => {
          setMapComponent(() => mod.default);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load map component:', err);
          setError('Failed to load map');
          setIsLoading(false);
        });
    }
  }, []);

  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    return (
      <div 
        style={{ height, width }} 
        className={`bg-gray-200 animate-pulse rounded-md flex items-center justify-center ${className}`}
      >
        <span className="text-gray-500">Loading map...</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        style={{ height, width }} 
        className={`bg-gray-200 animate-pulse rounded-md flex items-center justify-center ${className}`}
      >
        <span className="text-gray-500">Loading map...</span>
      </div>
    );
  }

  if (error || !MapComponent) {
    return (
      <div 
        style={{ height, width }} 
        className={`bg-red-100 border border-red-300 rounded-md flex items-center justify-center ${className}`}
      >
        <span className="text-red-600">Map unavailable</span>
      </div>
    );
  }

  return (
    <div style={{ height, width }} className={className}>
      <MapComponent 
        center={center}
        zoom={zoom}
        markers={markers}
        onClick={onClick}
        showUserLocation={showUserLocation}
        height={height}
        width={width}
        className={className}
      />
    </div>
  );
}
