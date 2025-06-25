'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Phone, Globe, Mail, Star, Navigation, Filter, Bookmark, BookmarkCheck } from 'lucide-react'
import { useAutismCenters } from '@/hooks/use-autism-centers'
import { useSavedLocations } from '@/hooks/use-saved-locations'
import { AutismCenter, LocationType } from '@/types/location'
import { calculateHaversineDistance, getCurrentLocation, findNearestCenter, sortCentersByDistance } from '@/lib/geoapify'
import { searchHealthcarePOI, searchAutismRelatedPOI, POIPlace, formatDistance, testGeoapifyAPI } from '@/lib/poi'
import { calculateRoute } from '@/lib/routing'
import { navigateToNavigationPage } from '@/lib/navigation-utils'
import dynamic from 'next/dynamic'
import GeoapifyAddressSearch from './GeoapifyAddressSearch'
import NearestCenterCard from './NearestCenterCard'
import QuickNearestButton from './QuickNearestButton'

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
  const router = useRouter()
  const { savedLocations, saveLocation, deleteLocation } = useSavedLocations()
  const [currentLocation, setCurrentLocation] = useState<[number, number]>([40.7589, -73.9851]) // Default to NYC
  const [selectedCenter, setSelectedCenter] = useState<AutismCenter | null>(null)
  const [typeFilter, setTypeFilter] = useState<LocationType | 'all'>('all')
  const [radiusFilter, setRadiusFilter] = useState<number>(25)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showSavedLocations, setShowSavedLocations] = useState(false)
  const [showNearestCenter, setShowNearestCenter] = useState(false) // Start with false, will be set to true when centers load
  const [showPOIPlaces, setShowPOIPlaces] = useState(false)
  const [poiPlaces, setPOIPlaces] = useState<POIPlace[]>([])
  const [poiLoading, setPOILoading] = useState(false)
  const [previewRoute, setPreviewRoute] = useState<any>(null)
  const [selectedCenterForRoute, setSelectedCenterForRoute] = useState<AutismCenter | null>(null)

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
    // Test API connectivity first
    testGeoapifyAPI()
    handleFindNearby()
  }, [])

  // Handle filter changes - refetch centers when filters change
  useEffect(() => {
    if (userLocation && !loading) {
      const refetchWithFilters = async () => {
        if (showPOIPlaces) {
          // Re-search autism centers with new filters
          setPOILoading(true)
          try {
            console.log('🔄 Re-searching autism centers with updated filters...')
            const places = await searchAutismRelatedPOI(userLocation[0], userLocation[1], radiusFilter * 1000, 30)
            console.log(`✅ Filter update found ${places.length} autism facilities`)
            setPOIPlaces(places)
          } catch (error) {
            console.error('Autism center re-search failed:', error)
            // Fallback to regular centers
            await fetchCenters({
              latitude: userLocation[0],
              longitude: userLocation[1],
              radius: radiusFilter,
              type: typeFilter === 'all' ? undefined : typeFilter
            })
            setShowPOIPlaces(false)
            setShowNearestCenter(false)
          } finally {
            setPOILoading(false)
          }
        } else {
          // Regular centers search
          await fetchCenters({
            latitude: userLocation[0],
            longitude: userLocation[1],
            radius: radiusFilter,
            type: typeFilter === 'all' ? undefined : typeFilter
          })
        }
      }

      refetchWithFilters()
    }
  }, [radiusFilter, typeFilter])

  const handleFindNearby = async () => {
    setIsLocating(true)
    setLocationError(null)

    let finalLat = 3.1390 // Default KL coordinates
    let finalLon = 101.6869

    try {
      // Try to get user's current location
      const location = await getCurrentLocation()
      finalLat = location.lat
      finalLon = location.lon
      console.log('✅ Got user location:', { lat: finalLat, lon: finalLon })
    } catch (error) {
      console.log('⚠️ Could not get user location, using KL default:', error)
      setLocationError('Using Kuala Lumpur as default location. You can search for your address or click "Use My Location" to try again.')
    }

    // Set the location regardless of whether we got user location or default
    setUserLocation([finalLat, finalLon])
    setCurrentLocation([finalLat, finalLon])

    // Always try to load regular autism centers first
    console.log('🔍 Loading autism centers from database...')
    try {
      await fetchCenters({
        latitude: finalLat,
        longitude: finalLon,
        radius: radiusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter
      })
      console.log('✅ Loaded autism centers from database')
      // Show the full centers list by default
      setShowNearestCenter(false)
    } catch (centerError) {
      console.error('❌ Failed to load centers from database:', centerError)
    }

    // Automatically search for all autism centers via POI API
    setPOILoading(true)
    try {
      console.log('🔍 Automatically searching for all autism centers and related facilities...')
      const places = await searchAutismRelatedPOI(finalLat, finalLon, radiusFilter * 1000, 30)
      console.log(`✅ Automatically found ${places.length} autism-related facilities`)
      if (places.length > 0) {
        console.log(`📍 Autism facilities found: ${places.map(p => p.name).join(', ')}`)
        setPOIPlaces(places)
        setShowPOIPlaces(true)
      } else {
        console.log('ℹ️ No additional autism facilities found via automatic search')
      }
    } catch (poiError) {
      console.log('⚠️ Automatic autism center search failed, using only database centers:', poiError)
      // Don't set error here, just continue with database centers
    } finally {
      setPOILoading(false)
      setIsLocating(false)
    }
  }

  const handleLocationSelect = async (location: { lat: number; lon: number; address: string }) => {
    setUserLocation([location.lat, location.lon])
    setCurrentLocation([location.lat, location.lon])
    setLocationError(null)

    // Always try to load regular autism centers first
    console.log('🔍 Loading autism centers from database for selected location...')
    try {
      await fetchCenters({
        latitude: location.lat,
        longitude: location.lon,
        radius: radiusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter
      })
      console.log('✅ Loaded autism centers from database for selected location')
      // Show the full centers list by default
      setShowNearestCenter(false)
    } catch (centerError) {
      console.error('❌ Failed to load centers from database:', centerError)
    }

    // Automatically search for all autism centers at selected location
    setPOILoading(true)
    try {
      console.log('🔍 Automatically searching for autism centers at selected location...')
      const places = await searchAutismRelatedPOI(location.lat, location.lon, radiusFilter * 1000, 30)
      console.log(`✅ Automatically found ${places.length} autism facilities at selected location`)
      if (places.length > 0) {
        console.log(`📍 Facilities at location: ${places.map(p => p.name).join(', ')}`)
        setPOIPlaces(places)
        setShowPOIPlaces(true)
        // Keep showing nearest center as well
      } else {
        console.log('ℹ️ No autism facilities found at selected location')
      }
    } catch (poiError) {
      console.log('⚠️ Automatic search failed for selected location, using only database centers:', poiError)
      // Don't set error here, just continue with database centers
    } finally {
      setPOILoading(false)
    }
  }

  const handleToggleFavorite = async (center: AutismCenter) => {
    try {
      const savedLocation = savedLocations.find(saved =>
        saved.latitude === center.latitude &&
        saved.longitude === center.longitude &&
        saved.name === center.name
      )

      if (savedLocation) {
        // Remove from favorites
        await deleteLocation(savedLocation.id)
      } else {
        // Add to favorites
        await saveLocation({
          name: center.name,
          type: center.type,
          address: center.address,
          latitude: center.latitude,
          longitude: center.longitude,
          phone: center.phone,
          notes: center.description
        })
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleGetDirections = (center: AutismCenter) => {
    // Navigate to the navigation page instead of opening a modal
    const navigationUrl = navigateToNavigationPage(center)
    router.push(navigationUrl)
  }



  // Show route preview for a center
  const handleShowRoute = async (center: AutismCenter) => {
    if (!userLocation) {
      setLocationError('Please set your location first to see route')
      return
    }

    try {
      console.log('🛣️ Calculating route preview to:', center.name)

      const route = await calculateRoute(
        { latitude: userLocation[0], longitude: userLocation[1] },
        { latitude: center.latitude, longitude: center.longitude },
        { mode: 'drive' }
      )

      if (route) {
        console.log('✅ Route calculated for preview:', route.summary)
        setPreviewRoute(route)
        setSelectedCenterForRoute(center)
        setShowNearestCenter(false)
        setShowPOIPlaces(false)
        setShowSavedLocations(false)
      } else {
        setLocationError('Could not calculate route to this center')
      }
    } catch (error) {
      console.error('❌ Route calculation failed:', error)
      setLocationError('Failed to calculate route')
    }
  }

  // Clear route preview
  const handleClearRoute = () => {
    setPreviewRoute(null)
    setSelectedCenterForRoute(null)
  }

  // Enhanced search for autism centers
  const handleSearchPOI = async () => {
    if (!userLocation) {
      setLocationError('Please set your location first')
      return
    }

    setPOILoading(true)
    try {
      console.log('🔍 Manual search for autism centers triggered...')
      // Use enhanced search with more comprehensive results
      const places = await searchAutismRelatedPOI(userLocation[0], userLocation[1], radiusFilter * 1000, 30)
      console.log(`✅ Manual search found ${places.length} autism facilities`)
      setPOIPlaces(places)
      setShowPOIPlaces(true)
      setShowNearestCenter(false)
      setShowSavedLocations(false)
    } catch (error) {
      console.error('Enhanced autism center search failed:', error)
      setLocationError('Failed to search for autism centers')
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

  // Debug logging
  console.log('🔍 Debug Info:', {
    userLocation,
    centersCount: centers.length,
    centersWithDistanceCount: centersWithDistance.length,
    poiPlacesCount: poiPlaces.length,
    showPOIPlaces,
    showNearestCenter,
    showSavedLocations,
    loading,
    poiLoading,
    isLocating
  })

  // Convert filtered POI places (autism-specific) to AutismCenter format
  const poiAutismCenters: AutismCenter[] = poiPlaces.map(place => ({
    id: place.id,
    name: place.name,
    type: 'therapy', // Most POI autism places are therapy/psychology centers
    address: place.formatted,
    latitude: place.latitude,
    longitude: place.longitude,
    phone: place.phone,
    description: `Psychology/Therapy Center - ${place.category}`,
    verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    distance: place.distance ? place.distance / 1000 : undefined // Convert meters to km
  }))

  // Combine database autism centers with POI autism centers
  const allAutismCenters = [...centersWithDistance, ...poiAutismCenters]

  // Sort all autism centers by distance
  const allCentersWithDistance = userLocation
    ? sortCentersByDistance({ lat: userLocation[0], lon: userLocation[1] }, allAutismCenters)
    : allAutismCenters

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
              🎯 {showNearestCenter ? 'Show All Centers' : 'Show Nearest Only'}
            </Button>



            {previewRoute && (
              <Button
                variant="secondary"
                onClick={handleClearRoute}
                className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                ❌ Clear Blue Route
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            {previewRoute && selectedCenterForRoute ? (
              <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-blue-800 font-medium">
                  🛣️ Blue route to {selectedCenterForRoute.name} - {previewRoute.summary}
                </span>
              </div>
            ) : showSavedLocations
              ? `${savedLocations.length} saved locations`
              : showNearestCenter
                ? `Showing nearest autism center${allCentersWithDistance.length > 1 ? ` (${allCentersWithDistance.length} total found)` : ''}`
                : `${allCentersWithDistance.length} autism centers found automatically`}
            {userLocation && !showSavedLocations && !showNearestCenter && !showPOIPlaces && !previewRoute && ` within ${radiusFilter}km`}
          </div>

          {/* Quick Nearest Center Button */}
          {!showSavedLocations && allCentersWithDistance.length > 0 && (
            <QuickNearestButton
              centers={allCentersWithDistance}
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
      {showNearestCenter && !showSavedLocations && allCentersWithDistance.length > 0 && (
        <NearestCenterCard
          centers={allCentersWithDistance}
          onCenterSelect={setSelectedCenter}
          onSaveCenter={handleToggleFavorite}
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
          centers={allCentersWithDistance}
          userLocation={userLocation || undefined}
          onCenterSelect={(center) => setSelectedCenter(center as AutismCenter)}
          route={previewRoute ? {
            coordinates: previewRoute.coordinates,
            summary: previewRoute.summary
          } : undefined}
          showRoute={!!previewRoute}
          className="h-full w-full"
          zoom={12}
        />

        {(isLocating || loading || poiLoading) && (
          <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg shadow text-sm">
            {isLocating ? 'Getting your location...' :
             poiLoading ? 'Automatically finding autism centers...' :
             'Loading centers...'}
          </div>
        )}
      </div>

      {/* All Autism Centers List */}
      {!showSavedLocations && !showNearestCenter && allCentersWithDistance.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Autism Centers ({allCentersWithDistance.length})</h2>
              <p className="text-sm text-gray-600">
                Autism diagnostic centers, therapy centers, psychology centers, and support facilities
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {allCentersWithDistance.map((center) => (
            <div key={center.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{center.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        center.type === 'diagnostic' ? 'bg-blue-100 text-blue-800' :
                        center.type === 'therapy' ? 'bg-green-100 text-green-800' :
                        center.type === 'support' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {center.type.charAt(0).toUpperCase() + center.type.slice(1)}
                      </span>
                      {center.verified && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Verified
                        </span>
                      )}
                      {center.distance && (
                        <span className="text-sm text-gray-500">
                          📍 {center.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`${isSaved(center) ? 'border-green-500 text-green-700 bg-green-50' : 'border-gray-300'}`}
                    onClick={() => handleToggleFavorite(center)}
                  >
                    {isSaved(center) ? (
                      <>
                        <BookmarkCheck className="h-3 w-3 mr-1" />
                        Remove
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-3 w-3 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Contact Information */}
              <div className="px-6 space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                  <p className="text-sm text-gray-600">{center.address}</p>
                </div>

                {center.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <a href={`tel:${center.phone}`} className="text-sm text-blue-600 hover:underline">
                      {center.phone}
                    </a>
                  </div>
                )}

                {center.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <a
                      href={center.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}

                {center.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <a href={`mailto:${center.email}`} className="text-sm text-blue-600 hover:underline">
                      {center.email}
                    </a>
                  </div>
                )}

                {center.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{center.rating}/5 rating</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {center.description && (
                <div className="px-6">
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {center.description}
                  </p>
                </div>
              )}

              {/* Services */}
              {center.services && center.services.length > 0 && (
                <div className="px-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Services Offered:</h4>
                  <div className="flex flex-wrap gap-1">
                    {center.services.map((service, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Age Groups */}
              {center.age_groups && center.age_groups.length > 0 && (
                <div className="px-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Age Groups Served:</h4>
                  <div className="flex flex-wrap gap-1">
                    {center.age_groups.map((age, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                      >
                        {age} years
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Insurance */}
              {center.insurance_accepted && center.insurance_accepted.length > 0 && (
                <div className="px-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Insurance Accepted:</h4>
                  <div className="flex flex-wrap gap-1">
                    {center.insurance_accepted.map((insurance, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800"
                      >
                        {insurance}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-6 pb-6 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShowRoute(center)}
                    className="flex items-center gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    🔵 Show Route
                  </Button>

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
                    className={`${isSaved(center) ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    onClick={() => handleToggleFavorite(center)}
                  >
                    {isSaved(center) ? (
                      <>
                        <BookmarkCheck className="h-3 w-3 mr-1" />
                        Remove from Favorites
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-3 w-3 mr-1" />
                        Add to Favorites
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Locations */}
      {showSavedLocations && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Your Favorite Autism Centers ({savedLocations.length})</h2>
              <p className="text-sm text-gray-600">
                Your saved autism centers for quick access
              </p>
            </div>
          </div>
          {savedLocations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bookmark className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No favorite centers yet</h3>
              <p className="text-sm mb-4">Save autism centers to quickly access them later!</p>
              <Button
                onClick={() => setShowSavedLocations(false)}
                variant="outline"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Browse Autism Centers
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {savedLocations.map((location) => (
                <div key={location.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow border-green-200 overflow-hidden">
                  {/* Header */}
                  <div className="p-6 pb-4 bg-green-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{location.name}</h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            location.type === 'diagnostic' ? 'bg-blue-100 text-blue-800' :
                            location.type === 'therapy' ? 'bg-green-100 text-green-800' :
                            location.type === 'support' ? 'bg-purple-100 text-purple-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ⭐ Favorite
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Saved on {new Date(location.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <BookmarkCheck className="h-5 w-5 text-green-600" />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="px-6 space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                      <p className="text-sm text-gray-600">{location.address}</p>
                    </div>

                    {location.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <a href={`tel:${location.phone}`} className="text-sm text-blue-600 hover:underline">
                          {location.phone}
                        </a>
                      </div>
                    )}

                    {location.notes && (
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">Your Notes:</h4>
                        <p className="text-sm text-blue-800">{location.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="px-6 pb-6 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowRoute({
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
                        className="flex items-center gap-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        🔵 Show Route
                      </Button>

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

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteLocation(location.id)}
                        className="flex items-center gap-1 border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <BookmarkCheck className="h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
