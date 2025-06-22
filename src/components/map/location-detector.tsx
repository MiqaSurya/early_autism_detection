'use client';

import { useEffect, useState } from 'react';
import { useMap, Circle } from 'react-leaflet';
import L from 'leaflet';

interface LocationDetectorProps {
  onLocationFound?: (position: [number, number]) => void;
  onLocationError?: (error: GeolocationPositionError) => void;
}

export default function LocationDetector({ 
  onLocationFound, 
  onLocationError 
}: LocationDetectorProps) {
  const map = useMap();
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'found' | 'error'>('idle');
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      const customError = {
        code: 0,
        message: 'Geolocation is not supported by your browser',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3
      } as GeolocationPositionError;
      setError(customError);
      if (onLocationError) onLocationError(customError);
      return;
    }

    setLocationStatus('detecting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newPosition: [number, number] = [latitude, longitude];
        
        setPosition(newPosition);
        setAccuracy(accuracy);
        setLocationStatus('found');
        
        // Center map on user location (with null check)
        if (map) {
          map.setView(newPosition, map.getZoom());
        }
        
        // Call callback if provided
        if (onLocationFound) {
          onLocationFound(newPosition);
        }
      },
      (error) => {
        setError(error);
        setLocationStatus('error');
        if (onLocationError) {
          onLocationError(error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  // Detect location on component mount (only when map is available)
  useEffect(() => {
    if (map) {
      detectLocation();
    }
  }, [map]);

  // Add a location button to the map
  useEffect(() => {
    if (!map || typeof window === 'undefined') return; // Exit early if map is not available or on server

    // Create a custom control for location detection
    const LocationControl = L.Control.extend({
      options: {
        position: 'topleft'
      },
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', '', container);
        button.href = '#';
        button.title = 'Locate me';
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4" y1="12" x2="2" y2="12"/><line x1="22" y1="12" x2="20" y2="12"/></svg>';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.width = '34px';
        button.style.height = '34px';
        
        // Add status indicator
        const statusIndicator = L.DomUtil.create('span', '', container);
        statusIndicator.style.position = 'absolute';
        statusIndicator.style.top = '5px';
        statusIndicator.style.right = '5px';
        statusIndicator.style.width = '8px';
        statusIndicator.style.height = '8px';
        statusIndicator.style.borderRadius = '50%';
        
        // Update status indicator based on location status
        if (locationStatus === 'detecting') {
          statusIndicator.style.backgroundColor = '#FFA500'; // Orange
        } else if (locationStatus === 'found') {
          statusIndicator.style.backgroundColor = '#00FF00'; // Green
        } else if (locationStatus === 'error') {
          statusIndicator.style.backgroundColor = '#FF0000'; // Red
        } else {
          statusIndicator.style.backgroundColor = '#CCCCCC'; // Gray
        }
        
        L.DomEvent.on(button, 'click', function(e) {
          L.DomEvent.preventDefault(e);
          detectLocation();
        });
        
        return container;
      }
    });
    
    const locationControl = new LocationControl();
    map.addControl(locationControl);
    
    return () => {
      map.removeControl(locationControl);
    };
  }, [map, locationStatus]);

  // Render accuracy circle if we have position and accuracy
  return position && accuracy ? (
    <Circle 
      center={position}
      radius={accuracy}
      pathOptions={{ 
        color: '#3388ff',
        fillColor: '#3388ff',
        fillOpacity: 0.15,
        weight: 2
      }}
    />
  ) : null;
}
