// Utility functions for getting directions to autism centers

export interface DirectionsOptions {
  latitude: number;
  longitude: number;
  name: string;
  address: string;
}

export function getDirectionsUrl(options: DirectionsOptions, provider: 'google' | 'apple' | 'waze' | 'auto' = 'auto'): string {
  const { latitude, longitude, name, address } = options;
  
  // Auto-detect best provider based on device
  if (provider === 'auto') {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      provider = 'apple';
    } else if (isAndroid) {
      provider = 'google';
    } else {
      provider = 'google'; // Default to Google for desktop
    }
  }
  
  switch (provider) {
    case 'apple':
      // Apple Maps (iOS)
      return `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
      
    case 'waze':
      // Waze
      return `waze://ul?ll=${latitude},${longitude}&navigate=yes`;
      
    case 'google':
    default:
      // Google Maps - simplified URL that works better
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }
}

export function openDirections(options: DirectionsOptions, provider: 'google' | 'apple' | 'waze' | 'auto' = 'google'): void {
  const { latitude, longitude, name } = options;

  // Always use Google Maps for consistency
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  const googleMapsSimple = `https://maps.google.com/?q=${latitude},${longitude}`;
  const appleMapsUrl = `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;

  console.log('Opening directions to:', name, 'at coordinates:', latitude, longitude);
  console.log('Google Maps URL:', googleMapsUrl);

  try {
    if (provider === 'apple') {
      // Only use Apple Maps if specifically requested
      window.open(appleMapsUrl, '_blank');
    } else {
      // Default to Google Maps for all other cases
      const opened = window.open(googleMapsUrl, '_blank');

      // Check if popup was blocked
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        console.log('Popup blocked, trying alternative method');
        // Try the simple URL format
        window.open(googleMapsSimple, '_blank');
      }
    }
  } catch (error) {
    // Ultimate fallback - simple Google Maps URL
    console.error('Error opening directions:', error);
    window.open(googleMapsSimple, '_blank');
  }
}

export function showDirectionsMenu(options: DirectionsOptions): void {
  const { name } = options;
  
  // Create a simple modal with direction options
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-sm w-full">
      <h3 class="text-lg font-semibold mb-4">Get Directions to ${name}</h3>
      <div class="space-y-2">
        <button class="w-full p-3 text-left border rounded hover:bg-gray-50" onclick="openGoogleMaps()">
          🗺️ Google Maps
        </button>
        <button class="w-full p-3 text-left border rounded hover:bg-gray-50" onclick="openAppleMaps()">
          🍎 Apple Maps
        </button>
        <button class="w-full p-3 text-left border rounded hover:bg-gray-50" onclick="openWaze()">
          🚗 Waze
        </button>
      </div>
      <button class="w-full mt-4 p-2 text-gray-600 hover:bg-gray-50 rounded" onclick="closeModal()">
        Cancel
      </button>
    </div>
  `;
  
  // Add event handlers
  (window as any).openGoogleMaps = () => {
    openDirections(options, 'google');
    document.body.removeChild(modal);
  };
  
  (window as any).openAppleMaps = () => {
    openDirections(options, 'apple');
    document.body.removeChild(modal);
  };
  
  (window as any).openWaze = () => {
    openDirections(options, 'waze');
    document.body.removeChild(modal);
  };
  
  (window as any).closeModal = () => {
    document.body.removeChild(modal);
  };
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  document.body.appendChild(modal);
}

// Simple directions function for testing
export function openSimpleDirections(latitude: number, longitude: number): void {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  console.log('Opening directions URL:', url);

  try {
    const newWindow = window.open(url, '_blank');
    if (!newWindow) {
      // If popup blocked, try alternative
      window.location.href = url;
    }
  } catch (error) {
    console.error('Error opening directions:', error);
    // Fallback - copy URL to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      alert(`Directions URL copied to clipboard: ${url}`);
    } else {
      alert(`Please go to: ${url}`);
    }
  }
}

// Helper function to copy coordinates to clipboard
export function copyCoordinates(latitude: number, longitude: number): void {
  const coordinates = `${latitude}, ${longitude}`;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(coordinates).then(() => {
      alert('Coordinates copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      fallbackCopyToClipboard(coordinates);
    });
  } else {
    fallbackCopyToClipboard(coordinates);
  }
}

function fallbackCopyToClipboard(text: string): void {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    document.execCommand('copy');
    alert('Coordinates copied to clipboard!');
  } catch (err) {
    alert(`Coordinates: ${text}`);
  }
  
  document.body.removeChild(textArea);
}
