'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Define types for our map
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

// Create a simple map component with no SSR
const MapWithNoSSR = dynamic<MapProps>(
  () => import('./MapComponent').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => <div className="bg-gray-200 animate-pulse rounded-md" style={{ height: '400px', width: '100%' }} />
  }
);

export default function Map({ 
  center = [51.505, -0.09],
  zoom = 13,
  markers = [],
  height = '400px',
  width = '100%',
  className = '',
  onClick,
  showUserLocation = true
}: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div 
        style={{ height, width }} 
        className={`bg-gray-200 animate-pulse rounded-md ${className}`} 
      />
    );
  }


  return (
    <div style={{ height, width }} className={className}>
      <MapWithNoSSR 
        center={center}
        zoom={zoom}
        markers={markers}
        onClick={onClick}
        showUserLocation={showUserLocation}
      />
    </div>
  );
}
