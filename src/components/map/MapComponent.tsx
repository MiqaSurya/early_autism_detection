'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import dynamic from 'next/dynamic';

// Leaflet CSS is imported in globals.css

// Dynamic import for LocationDetector to prevent SSR issues
const LocationDetector = dynamic(() => import('./location-detector'), {
  ssr: false
});

// Fix for default marker icons in Leaflet with Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

// Define types
type LatLng = { lat: number; lng: number };

interface MapClickHandlerProps {
  onClick: (latlng: LatLng) => void;
}

// Component to handle map click events
function MapClickHandler({ onClick }: MapClickHandlerProps) {
  const map = useMap();

  useMapEvents({
    click: (e) => {
      onClick(e.latlng);
    },
  });

  return null;
}

// Simple component to recenter map when position changes
function MapCenterer({ position }: { position: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    // Only try to center if map exists
    if (map) {
      // Use a timeout to ensure map is ready
      setTimeout(() => {
        try {
          map.setView(position, map.getZoom());
        } catch (error) {
          console.error('Error centering map:', error);
        }
      }, 100);
    }
  }, [map, position]);

  return null;
}

// Main map component
function MapContent({ 
  center, 
  zoom, 
  markers, 
  onClick,
  showUserLocation
}: { 
  center: [number, number]; 
  zoom: number; 
  markers: Array<{ position: [number, number]; popup?: React.ReactNode }>;
  onClick?: (latlng: LatLng) => void;
  showUserLocation?: boolean;
  userLocationAccuracy?: number;
}) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<GeolocationPositionError | null>(null);
  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      
      {onClick && <MapClickHandler onClick={onClick} />}
      
      {showUserLocation && (
        <>
          {/* Use the LocationDetector component */}
          <LocationDetector
            onLocationFound={(position: [number, number]) => {
              setUserPosition(position);
            }}
            onLocationError={(error: GeolocationPositionError) => {
              setLocationError(error);
              console.error('Location error:', error.message);
            }}
          />

          {/* Show user marker if position is found */}
          {userPosition && (
            <Marker
              position={userPosition}
              icon={new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Popup>You are here</Popup>
            </Marker>
          )}
        </>
      )}

      {markers.map((marker, idx) => (
        <Marker key={idx} position={marker.position}>
          {marker.popup && (
            <Popup>
              <div onClick={(e) => e.stopPropagation()}>
                {marker.popup}
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}

// Main component with dynamic import
function LeafletMap(props: {
  center: [number, number];
  zoom: number;
  markers: Array<{ position: [number, number]; popup?: React.ReactNode }>;
  onClick?: (latlng: LatLng) => void;
  className?: string;
  showUserLocation?: boolean;
}) {
  const { center, zoom, markers, onClick, className, showUserLocation } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={className} style={{ backgroundColor: '#e5e7eb' }} />;
  }

  return (
    <div className={className}>
      <MapContent 
        center={center}
        zoom={zoom}
        markers={markers}
        onClick={onClick}
        showUserLocation={showUserLocation}
      />
    </div>
  );
}

export default function MapComponent({
  center = [51.505, -0.09],
  zoom = 13,
  markers = [],
  height = '400px',
  width = '100%',
  className = '',
  onClick,
  showUserLocation = true, // Default to true to enable location detection
}: {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{ position: [number, number]; popup?: React.ReactNode }>;
  height?: string;
  width?: string;
  className?: string;
  onClick?: (latlng: { lat: number; lng: number }) => void;
  showUserLocation?: boolean;
  userLocationAccuracy?: number;
}) {
  return (
    <div style={{ height, width }} className={className}>
      <LeafletMap 
        center={center}
        zoom={zoom}
        markers={markers}
        onClick={onClick}
        showUserLocation={showUserLocation}
      />
    </div>
  );
}
