'use client';

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

// Create a completely client-side only map component
const ClientOnlyMap = dynamic(() => import('./ClientOnlyMap'), {
  ssr: false,
  loading: () => (
    <div
      className="bg-gray-200 animate-pulse rounded-md flex items-center justify-center"
      style={{ height: '400px', width: '100%' }}
    >
      <span className="text-gray-500">Loading map...</span>
    </div>
  )
});

export default function Map(props: MapProps) {
  return <ClientOnlyMap {...props} />;
}
