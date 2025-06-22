'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Globe, Mail, Star, Navigation, Filter, Search, Navigation2, Bookmark, BookmarkCheck } from 'lucide-react';
import { useAutismCenters } from '@/hooks/use-autism-centers';
import { useSavedLocations } from '@/hooks/use-saved-locations';
import { AutismCenter, LocationType } from '@/types/location';
import { openDirections, copyCoordinates, openSimpleDirections } from '@/utils/directions';

// Import the Map component with no SSR
const Map = dynamic(() => import('@/components/map/map'), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-gray-200 rounded-lg animate-pulse" />
});

// Type filter options
const TYPE_FILTERS: { value: LocationType | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All Centers', color: 'bg-gray-500' },
  { value: 'diagnostic', label: 'Diagnostic', color: 'bg-blue-500' },
  { value: 'therapy', label: 'Therapy', color: 'bg-green-500' },
  { value: 'support', label: 'Support Groups', color: 'bg-purple-500' },
  { value: 'education', label: 'Education', color: 'bg-orange-500' },
];

// Get marker color based on center type
const getMarkerColor = (type: LocationType): string => {
  const colors = {
    diagnostic: 'blue',
    therapy: 'green',
    support: 'violet',
    education: 'orange'
  };
  return colors[type] || 'red';
};

export default function OSMLocationFinder() {
  const { savedLocations, saveLocation } = useSavedLocations();
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([40.7589, -73.9851]); // Default to NYC
  const [selectedCenter, setSelectedCenter] = useState<AutismCenter | null>(null);
  const [typeFilter, setTypeFilter] = useState<LocationType | 'all'>('all');
  const [radiusFilter, setRadiusFilter] = useState<number>(25);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSavedLocations, setShowSavedLocations] = useState(false);

  // Use autism centers hook
  const {
    centers,
    loading,
    error,
    findNearbyWithLocation,
    searchByType,
    searchByRadius,
    fetchCenters
  } = useAutismCenters({
    latitude: userLocation?.[0],
    longitude: userLocation?.[1],
    radius: radiusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    autoFetch: false
  });

  // Get user location and fetch centers on mount
  useEffect(() => {
    handleFindNearby();
  }, []);

  // Handle filter changes
  useEffect(() => {
    if (userLocation) {
      if (typeFilter === 'all') {
        fetchCenters({ latitude: userLocation[0], longitude: userLocation[1], radius: radiusFilter });
      } else {
        searchByType(typeFilter);
      }
    }
  }, [typeFilter, radiusFilter, userLocation]);

  const handleFindNearby = async () => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setCurrentLocation([latitude, longitude]);
        setIsLocating(false);

        // Fetch centers for this location
        await fetchCenters({ latitude, longitude, radius: radiusFilter });
      },
      (error) => {
        let errorMessage = 'Failed to get your location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }

        setLocationError(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleSaveCenter = async (center: AutismCenter) => {
    try {
      await saveLocation({
        name: center.name,
        type: center.type,
        address: center.address,
        latitude: center.latitude,
        longitude: center.longitude,
        phone: center.phone,
        notes: center.description
      });
    } catch (error) {
      console.error('Failed to save center:', error);
    }
  };

  const handleGetDirections = (center: AutismCenter) => {
    console.log('Getting directions for:', center.name);
    openDirections({
      latitude: center.latitude,
      longitude: center.longitude,
      name: center.name,
      address: center.address
    }, 'google'); // Force Google Maps
  };

  const handleCopyCoordinates = (center: AutismCenter) => {
    copyCoordinates(center.latitude, center.longitude);
  };

  // Check if a center is already saved
  const isSaved = (center: AutismCenter): boolean => {
    return savedLocations.some(saved =>
      saved.latitude === center.latitude &&
      saved.longitude === center.longitude &&
      saved.name === center.name
    );
  };

  // Create markers for autism centers
  const centerMarkers = centers.map(center => ({
    position: [center.latitude, center.longitude] as [number, number],
    popup: (
      <div className="p-2 max-w-sm">
        <div className="mb-2">
          <h3 className="font-semibold text-sm">{center.name}</h3>
          <span className={`inline-block px-2 py-1 text-xs rounded ${TYPE_FILTERS.find(f => f.value === center.type)?.color} text-white mt-1`}>
            {TYPE_FILTERS.find(f => f.value === center.type)?.label}
          </span>
        </div>

        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{center.address}</span>
          </div>

          {center.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span>{center.phone}</span>
            </div>
          )}

          {center.distance && (
            <div className="text-blue-600 font-medium">
              {center.distance} km away
            </div>
          )}

          {center.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{center.rating}/5</span>
            </div>
          )}
        </div>

        <div className="flex gap-1 mt-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleGetDirections(center);
            }}
            title="Get directions"
          >
            <Navigation2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCenter(center);
            }}
          >
            Details
          </Button>
          <Button
            size="sm"
            className={`text-xs ${isSaved(center) ? 'bg-green-600 hover:bg-green-700' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleSaveCenter(center);
            }}
            disabled={isSaved(center)}
          >
            {isSaved(center) ? (
              <>
                <BookmarkCheck className="h-3 w-3 mr-1" />
                Saved
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>
    ),
  }));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <Button
            onClick={handleFindNearby}
            disabled={isLocating || loading}
            className="flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            {isLocating ? 'Locating...' : 'Find Nearby Centers'}
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowSavedLocations(!showSavedLocations)}
            className="flex items-center gap-2"
          >
            <Bookmark className="h-4 w-4" />
            Saved Locations ({savedLocations.length})
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          {showSavedLocations ? `${savedLocations.length} saved locations` : `${centers.length} centers found`}
          {userLocation && !showSavedLocations && ` within ${radiusFilter}km`}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Filter Options</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Center Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPE_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={typeFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTypeFilter(filter.value)}
                    className="text-xs"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Search Radius: {radiusFilter}km
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={radiusFilter}
                onChange={(e) => setRadiusFilter(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5km</span>
                <span>100km</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {(error || locationError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">
            {error || locationError}
          </p>
        </div>
      )}

      {/* Map */}
      <div className="h-96 w-full rounded-lg overflow-hidden relative">
        <Map
          center={currentLocation}
          zoom={12}
          markers={centerMarkers}
          className="h-full"
          showUserLocation={!!userLocation}
        />

        {(isLocating || loading) && (
          <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow text-sm">
            {isLocating ? 'Getting your location...' : 'Loading centers...'}
          </div>
        )}
      </div>

      {/* Saved Locations List */}
      {showSavedLocations && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Saved Locations</h2>
          {savedLocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No saved locations yet.</p>
              <p className="text-sm">Click the "Save" button on any center to add it to your saved locations!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedLocations.map((location) => (
                <div key={location.id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-blue-200">
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold">{location.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${TYPE_FILTERS.find(f => f.value === location.type)?.color} text-white`}>
                          {TYPE_FILTERS.find(f => f.value === location.type)?.label}
                        </span>
                        <BookmarkCheck className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Saved on {new Date(location.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                      <p className="text-sm text-gray-600">{location.address}</p>
                    </div>

                    {location.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <p className="text-sm text-gray-600">{location.phone}</p>
                      </div>
                    )}

                    {location.notes && (
                      <div className="bg-blue-50 p-2 rounded text-sm">
                        <strong>Your notes:</strong> {location.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Force Google Maps directly
                        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
                        console.log('SAVED LOCATION - Opening Google Maps:', googleMapsUrl);
                        console.log('Location details:', location.name, location.latitude, location.longitude);

                        try {
                          const opened = window.open(googleMapsUrl, '_blank');
                          if (!opened) {
                            console.log('Popup blocked, trying alternative');
                            window.location.href = googleMapsUrl;
                          }
                        } catch (error) {
                          console.error('Error opening Google Maps:', error);
                          alert(`Please go to: ${googleMapsUrl}`);
                        }
                      }}
                      className="flex items-center gap-1"
                    >
                      <Navigation2 className="h-3 w-3" />
                      Directions
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCoordinates(location.latitude, location.longitude)}
                      title="Copy coordinates"
                    >
                      📋
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Centers List */}
      {!showSavedLocations && centers.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {centers.map((center) => (
            <div key={center.id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold">{center.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded ${TYPE_FILTERS.find(f => f.value === center.type)?.color} text-white`}>
                      {TYPE_FILTERS.find(f => f.value === center.type)?.label}
                    </span>
                    {isSaved(center) && <BookmarkCheck className="h-4 w-4 text-blue-500" />}
                  </div>
                </div>
                {center.distance && (
                  <p className="text-sm text-blue-600 font-medium">
                    {center.distance} km away
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                  <p className="text-sm text-gray-600">{center.address}</p>
                </div>

                {center.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <p className="text-sm text-gray-600">{center.phone}</p>
                  </div>
                )}

                {center.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <p className="text-sm text-gray-600">{center.rating}/5</p>
                  </div>
                )}

                {center.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {center.description}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGetDirections(center)}
                  className="flex items-center gap-1"
                >
                  <Navigation2 className="h-3 w-3" />
                  Directions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCenter(center)}
                >
                  Details
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveCenter(center)}
                  disabled={isSaved(center)}
                  className={isSaved(center) ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {isSaved(center) ? (
                    <>
                      <BookmarkCheck className="h-3 w-3 mr-1" />
                      Saved
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Center Details Modal */}
      {selectedCenter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedCenter.name}</h2>
                  <span className={`inline-block px-2 py-1 text-xs rounded mt-1 ${TYPE_FILTERS.find(f => f.value === selectedCenter.type)?.color} text-white`}>
                    {TYPE_FILTERS.find(f => f.value === selectedCenter.type)?.label}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCenter(null)}
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {selectedCenter.description && (
                <p className="text-gray-700">{selectedCenter.description}</p>
              )}

              <div className="grid gap-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-gray-600">{selectedCenter.address}</p>
                  </div>
                </div>

                {selectedCenter.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-gray-600">{selectedCenter.phone}</p>
                    </div>
                  </div>
                )}

                {selectedCenter.website && (
                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div>
                      <p className="font-medium">Website</p>
                      <a
                        href={selectedCenter.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedCenter.website}
                      </a>
                    </div>
                  </div>
                )}

                {selectedCenter.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a
                        href={`mailto:${selectedCenter.email}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {selectedCenter.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {selectedCenter.services && selectedCenter.services.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Services</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedCenter.services.map((service, index) => (
                      <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 border rounded">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedCenter.age_groups && selectedCenter.age_groups.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Age Groups Served</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedCenter.age_groups.map((age, index) => (
                      <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 border rounded">
                        {age}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <div className="flex gap-1">
                  <Button
                    onClick={() => handleGetDirections(selectedCenter)}
                    className="flex items-center gap-2"
                  >
                    <Navigation2 className="h-4 w-4" />
                    Get Directions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyCoordinates(selectedCenter)}
                    title="Copy coordinates to clipboard"
                  >
                    📋
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleSaveCenter(selectedCenter)}
                  disabled={isSaved(selectedCenter)}
                  className={`flex items-center gap-2 ${isSaved(selectedCenter) ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                >
                  {isSaved(selectedCenter) ? (
                    <>
                      <BookmarkCheck className="h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" />
                      Save Location
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCenter(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
