'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Phone, Globe, Mail, Star, Navigation, Filter, Bookmark, BookmarkCheck } from 'lucide-react'
import { useAutismCenters } from '@/hooks/use-autism-centers'
import { useSavedLocations } from '@/hooks/use-saved-locations'
import { AutismCenter, LocationType } from '@/types/location'
import { calculateHaversineDistance, getCurrentLocation, findNearestCenter, sortCentersByDistance } from '@/lib/geoapify'
import { searchHealthcarePOI, searchAutismRelatedPOI, POIPlace, formatDistance } from '@/lib/poi'
import dynamic from 'next/dynamic'
import GeoapifyAddressSearch from './GeoapifyAddressSearch'
import NearestCenterCard from './NearestCenterCard'
import QuickNearestButton from './QuickNearestButton'
import FullNavigationScreen from '../navigation/FullNavigationScreen'

// Dynamic import for Geoapify map component
const GeoapifyMap = dynamic(() => import('@/components/map/GeoapifyMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full bg-gray-200 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  )
})

// Type filter options
const TYPE_FILTERS: { value: LocationType | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All Centers', color: 'bg-gray-500' },
  { value: 'diagnostic', label: 'Diagnostic', color: 'bg-blue-500' },
  { value: 'therapy', label: 'Therapy', color: 'bg-green-500' },
  { value: 'support', label: 'Support Groups', color: 'bg-purple-500' },
  { value: 'education', label: 'Education', color: 'bg-orange-500' },
]

export default function GeoapifyLocationFinder() {
  const { savedLocations, saveLocation } = useSavedLocations()
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([40.7589, -73.9851]) // Default to NYC
  const [selectedCenter, setSelectedCenter] = useState<AutismCenter | null>(null)
  const [typeFilter, setTypeFilter] = useState<LocationType | 'all'>('all')
  const [radiusFilter, setRadiusFilter] = useState<number>(25)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showSavedLocations, setShowSavedLocations] = useState(false)
  const [showNearestCenter, setShowNearestCenter] = useState(true)
  const [showPOIPlaces, setShowPOIPlaces] = useState(false)
  const [poiPlaces, setPOIPlaces] = useState<POIPlace[]>([])
  const [poiLoading, setPOILoading] = useState(false)
  const [navigationCenter, setNavigationCenter] = useState<AutismCenter | null>(null)

  // Use autism centers hook
  const {
    centers,
    loading,
    error,
    fetchCenters
  } = useAutismCenters({
    latitude: userLocation?.[0],
    longitude: userLocation?.[1],
    radius: radiusFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    autoFetch: false
  })

  // Get user location and fetch centers on mount
  useEffect(() => {
    handleFindNearby()
  }, [])

  // Handle filter changes
  useEffect(() => {
    if (userLocation) {
      fetchCenters({ 
        latitude: userLocation[0], 
        longitude: userLocation[1], 
        radius: radiusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter
      })
    }
  }, [typeFilter, radiusFilter, userLocation])

  const handleFindNearby = async () => {
    setIsLocating(true)
    setLocationError(null)

    try {
      const location = await getCurrentLocation()
      setUserLocation([location.lat, location.lon])
      setCurrentLocation([location.lat, location.lon])
      
      // Fetch centers for this location
      await fetchCenters({ 
        latitude: location.lat, 
        longitude: location.lon, 
        radius: radiusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter
      })
    } catch (error) {
      console.error('Location error:', error)
      setLocationError('Unable to get your location. Please search for an address instead.')
    } finally {
      setIsLocating(false)
    }
  }

  const handleLocationSelect = async (location: { lat: number; lon: number; address: string }) => {
    setUserLocation([location.lat, location.lon])
    setCurrentLocation([location.lat, location.lon])
    setLocationError(null)
    
    // Fetch centers for this location
    await fetchCenters({ 
      latitude: location.lat, 
      longitude: location.lon, 
      radius: radiusFilter,
      type: typeFilter === 'all' ? undefined : typeFilter
    })
  }

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
      })
    } catch (error) {
      console.error('Failed to save center:', error)
    }
  }

  const handleGetDirections = (center: AutismCenter) => {
    setNavigationCenter(center)
  }

  const handleCloseNavigation = () => {
    setNavigationCenter(null)
  }

  // Search for POI places using your exact code pattern
  const handleSearchPOI = async () => {
    if (!userLocation) {
      setLocationError('Please set your location first')
      return
    }

    setPOILoading(true)
    try {
      // Use your exact POI search pattern
      const places = await searchAutismRelatedPOI(userLocation[0], userLocation[1], radiusFilter * 1000, 20)
      setPOIPlaces(places)
      setShowPOIPlaces(true)
      setShowNearestCenter(false)
      setShowSavedLocations(false)
    } catch (error) {
      console.error('POI search failed:', error)
      setLocationError('Failed to search for nearby places')
    } finally {
      setPOILoading(false)
    }
  }

  // Check if a center is already saved
  const isSaved = (center: AutismCenter): boolean => {
    return savedLocations.some(saved =>
      saved.latitude === center.latitude &&
      saved.longitude === center.longitude &&
      saved.name === center.name
    )
  }

  // Calculate distances for centers and sort by distance
  const centersWithDistance = userLocation
    ? sortCentersByDistance({ lat: userLocation[0], lon: userLocation[1] }, centers)
    : centers.map(center => ({ ...center, distance: undefined }))

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <GeoapifyAddressSearch
              onLocationSelect={handleLocationSelect}
              placeholder="Search for an address or location..."
              showCurrentLocationButton={true}
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleFindNearby}
              disabled={isLocating || loading}
              className="flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              {isLocating ? 'Locating...' : 'Use My Location'}
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
              Saved ({savedLocations.length})
            </Button>

            <Button
              variant={showNearestCenter ? "default" : "outline"}
              onClick={() => {
                setShowNearestCenter(!showNearestCenter)
                setShowPOIPlaces(false)
                setShowSavedLocations(false)
              }}
              className="flex items-center gap-2"
            >
              🎯 Nearest Center
            </Button>

            <Button
              variant={showPOIPlaces ? "default" : "outline"}
              onClick={() => {
                if (showPOIPlaces) {
                  setShowPOIPlaces(false)
                } else {
                  handleSearchPOI()
                }
              }}
              disabled={poiLoading}
              className="flex items-center gap-2"
            >
              🏥 {poiLoading ? 'Searching...' : 'Nearby Places'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            {showSavedLocations
              ? `${savedLocations.length} saved locations`
              : showPOIPlaces
                ? `${poiPlaces.length} nearby places found`
                : showNearestCenter
                  ? `Showing nearest center${centersWithDistance.length > 1 ? ` (${centersWithDistance.length} total found)` : ''}`
                  : `${centersWithDistance.length} centers found`}
            {userLocation && !showSavedLocations && !showNearestCenter && !showPOIPlaces && ` within ${radiusFilter}km`}
          </div>

          {/* Quick Nearest Center Button */}
          {!showSavedLocations && centersWithDistance.length > 0 && (
            <QuickNearestButton
              centers={centersWithDistance}
              onNearestFound={(center, distance) => {
                setSelectedCenter(center)
                setShowNearestCenter(true)
              }}
              onNavigate={handleGetDirections}
              className="w-full sm:w-auto"
            />
          )}
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

      {/* Nearest Center Card */}
      {showNearestCenter && !showSavedLocations && centersWithDistance.length > 0 && (
        <NearestCenterCard
          centers={centersWithDistance}
          onCenterSelect={setSelectedCenter}
          onSaveCenter={handleSaveCenter}
          onNavigate={handleGetDirections}
          isSaved={isSaved}
          className="mb-6"
        />
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
        <GeoapifyMap
          centers={centersWithDistance}
          userLocation={userLocation || undefined}
          onCenterSelect={(center) => setSelectedCenter(center as AutismCenter)}
          className="h-full w-full"
          zoom={12}
        />

        {(isLocating || loading) && (
          <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow text-sm">
            {isLocating ? 'Getting your location...' : 'Loading centers...'}
          </div>
        )}
      </div>

      {/* Centers List */}
      {!showSavedLocations && !showNearestCenter && centersWithDistance.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {centersWithDistance.map((center) => (
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
                    {center.distance.toFixed(1)} km away
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
                  <p className="text-sm text-gray-600">{center.description}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGetDirections(center)}
                  className="flex items-center gap-1"
                >
                  <Navigation className="h-3 w-3" />
                  Navigate
                </Button>
                
                <Button
                  size="sm"
                  className={`${isSaved(center) ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  onClick={() => handleSaveCenter(center)}
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
          ))}
        </div>
      )}

      {/* Saved Locations */}
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
                      onClick={() => handleGetDirections({
                        id: location.id,
                        name: location.name,
                        type: location.type,
                        address: location.address,
                        latitude: location.latitude,
                        longitude: location.longitude,
                        phone: location.phone,
                        description: location.notes,
                        verified: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      })}
                      className="flex items-center gap-1"
                    >
                      <Navigation className="h-3 w-3" />
                      Navigate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* POI Places */}
      {showPOIPlaces && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Nearby Healthcare & Support Places</h2>
          <p className="text-sm text-gray-600">
            Found using Point of Interest search - includes hospitals, clinics, psychology centers, schools, and community facilities
          </p>

          {poiPlaces.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🏥</div>
              <p>No nearby places found.</p>
              <p className="text-sm">Try increasing the search radius or searching from a different location.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {poiPlaces.map((place) => (
                <div key={place.id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border-green-200">
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold">{place.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="inline-block px-2 py-1 text-xs rounded bg-green-500 text-white">
                          {place.category.split('.').pop()?.replace('_', ' ') || 'POI'}
                        </span>
                      </div>
                    </div>
                    {place.distance && (
                      <p className="text-sm text-green-600 font-medium">
                        {formatDistance(place.distance)} away
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                      <p className="text-sm text-gray-600">{place.formatted}</p>
                    </div>

                    {place.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <a href={`tel:${place.phone}`} className="text-sm text-blue-600 hover:underline">
                          {place.phone}
                        </a>
                      </div>
                    )}

                    {place.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          Visit Website
                        </a>
                      </div>
                    )}

                    {place.rating && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <p className="text-sm text-gray-600">{place.rating}/5</p>
                      </div>
                    )}

                    {place.opening_hours && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        {place.opening_hours}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGetDirections({
                        id: place.id,
                        name: place.name,
                        type: 'support', // Default type for POI places
                        address: place.formatted,
                        latitude: place.latitude,
                        longitude: place.longitude,
                        phone: place.phone,
                        description: `${place.category} - Found via POI search`,
                        verified: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      })}
                      className="flex items-center gap-1"
                    >
                      <Navigation className="h-3 w-3" />
                      Navigate
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleSaveCenter({
                        id: place.id,
                        name: place.name,
                        type: 'support',
                        address: place.formatted,
                        latitude: place.latitude,
                        longitude: place.longitude,
                        phone: place.phone,
                        description: `${place.category} - Found via POI search`,
                        verified: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                      })}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Save Place
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full Navigation Screen */}
      {navigationCenter && (
        <FullNavigationScreen
          destination={navigationCenter}
          onClose={handleCloseNavigation}
        />
      )}
    </div>
  )
}
