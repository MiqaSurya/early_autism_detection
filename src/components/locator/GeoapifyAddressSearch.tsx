'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, Loader2, X, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAutocompleteSuggestions, GeoapifyPlace, formatAddress, getCurrentLocation } from '@/lib/geoapify'
import { searchPlaces, getCurrentAddress, GeocodeResult } from '@/lib/geocoding'

interface GeoapifyAddressSearchProps {
  onLocationSelect: (location: { lat: number; lon: number; address: string }) => void
  placeholder?: string
  className?: string
  showCurrentLocationButton?: boolean
}

export default function GeoapifyAddressSearch({
  onLocationSelect,
  placeholder = "Search for an address...",
  className = "",
  showCurrentLocationButton = true
}: GeoapifyAddressSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeoapifyPlace[]>([])
  const [geocodeSuggestions, setGeocodeSuggestions] = useState<GeocodeResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [useNewGeocoding, setUseNewGeocoding] = useState(false) // Default to working original API
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Hardcoded Malaysia locations as final fallback
  const getHardcodedMalaysiaLocations = (searchQuery: string): GeoapifyPlace[] => {
    const locations = [
      { name: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869, state: 'Federal Territory' },
      { name: 'Petaling Jaya', lat: 3.1073, lon: 101.6067, state: 'Selangor' },
      { name: 'Shah Alam', lat: 3.0733, lon: 101.5185, state: 'Selangor' },
      { name: 'Subang Jaya', lat: 3.1478, lon: 101.5810, state: 'Selangor' },
      { name: 'Johor Bahru', lat: 1.4927, lon: 103.7414, state: 'Johor' },
      { name: 'Penang', lat: 5.4164, lon: 100.3327, state: 'Penang' },
      { name: 'Ipoh', lat: 4.5975, lon: 101.0901, state: 'Perak' },
      { name: 'Malacca', lat: 2.2055, lon: 102.2501, state: 'Malacca' },
      { name: 'Kota Kinabalu', lat: 5.9804, lon: 116.0735, state: 'Sabah' },
      { name: 'Kuching', lat: 1.5533, lon: 110.3592, state: 'Sarawak' }
    ]

    const filtered = locations.filter(loc =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.state.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return filtered.map(loc => ({
      place_id: `hardcoded-${loc.name.toLowerCase().replace(/\s+/g, '-')}`,
      display_name: `${loc.name}, ${loc.state}, Malaysia`,
      lat: loc.lat,
      lon: loc.lon,
      address: {
        city: loc.name,
        state: loc.state,
        country: 'Malaysia'
      }
    }))
  }

  // Debounced search function
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (query.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoading(true)
    
    debounceRef.current = setTimeout(async () => {
      try {
        if (useNewGeocoding) {
          // Use new geocoding API
          const results = await searchPlaces(query, {
            limit: 5,
            countryCode: 'MY' // Focus on Malaysia
          })

          if (results.length > 0) {
            setGeocodeSuggestions(results)
            setSuggestions([]) // Clear old suggestions
          } else {
            // Fallback to original API if new one returns no results
            console.log('🔄 New API returned no results, falling back to original API')
            const fallbackResults = await getAutocompleteSuggestions(query)
            setSuggestions(fallbackResults)
            setGeocodeSuggestions([])
          }
        } else {
          // Use original API
          console.log('🔍 Using original API for query:', query)
          const results = await getAutocompleteSuggestions(query)
          console.log('📋 Original API results:', results)
          setSuggestions(results)
          setGeocodeSuggestions([]) // Clear new suggestions
        }
        setShowSuggestions(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Search error:', error)

        // Try fallback to original API if new API fails
        if (useNewGeocoding) {
          try {
            console.log('🔄 New API failed, trying original API as fallback')
            const fallbackResults = await getAutocompleteSuggestions(query)
            setSuggestions(fallbackResults)
            setGeocodeSuggestions([])
            setShowSuggestions(true)
            setSelectedIndex(-1)
          } catch (fallbackError) {
            console.error('Fallback search also failed:', fallbackError)
            // Try hardcoded Malaysia locations as final fallback
            const hardcodedResults = getHardcodedMalaysiaLocations(query)
            setSuggestions(hardcodedResults)
            setGeocodeSuggestions([])
            if (hardcodedResults.length > 0) {
              setShowSuggestions(true)
              setSelectedIndex(-1)
            }
          }
        } else {
          // Try hardcoded locations if original API also fails
          const hardcodedResults = getHardcodedMalaysiaLocations(query)
          setSuggestions(hardcodedResults)
          setGeocodeSuggestions([])
          if (hardcodedResults.length > 0) {
            setShowSuggestions(true)
            setSelectedIndex(-1)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentSuggestions = useNewGeocoding ? geocodeSuggestions : suggestions
    if (!showSuggestions || currentSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < currentSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : currentSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < currentSuggestions.length) {
          if (useNewGeocoding) {
            handleGeocodeSelect(geocodeSuggestions[selectedIndex])
          } else {
            handleSuggestionSelect(suggestions[selectedIndex])
          }
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Navigate from user's live location to selected destination
  const handleNavigateToLocation = async (destination: { lat: number; lon: number; name: string; address?: string }) => {
    try {
      console.log('🧭 Starting navigation to:', destination.name)

      // Get user's current location
      const userLocation = await getCurrentLocation({
        timeout: 10000,
        enableHighAccuracy: true
      })

      console.log('📍 User location:', userLocation)
      console.log('🎯 Destination:', destination)

      // Navigate to the turn-by-turn navigation page with correct parameters
      const params = new URLSearchParams({
        name: destination.name,
        address: destination.address || destination.name, // Use provided address or fallback to name
        latitude: destination.lat.toString(),
        longitude: destination.lon.toString(),
        type: 'diagnostic' // Default type
      })

      router.push(`/dashboard/turn-by-turn?${params}`)

    } catch (error) {
      console.error('Navigation error:', error)
      alert('Unable to get your location for navigation. Please enable location services and try again.')
    }
  }

  // Handle suggestion selection (original API)
  const handleSuggestionSelect = (place: GeoapifyPlace) => {
    const address = formatAddress(place)
    setQuery(address)
    setShowSuggestions(false)
    setSuggestions([])
    setGeocodeSuggestions([])
    setSelectedIndex(-1)

    onLocationSelect({
      lat: place.lat,
      lon: place.lon,
      address: address
    })
  }

  // Handle geocode selection (new API)
  const handleGeocodeSelect = (result: GeocodeResult) => {
    setQuery(result.formatted)
    setShowSuggestions(false)
    setSuggestions([])
    setGeocodeSuggestions([])
    setSelectedIndex(-1)

    onLocationSelect({
      lat: result.latitude,
      lon: result.longitude,
      address: result.formatted
    })
  }

  // Get current location
  const handleCurrentLocation = async () => {
    setIsLoadingLocation(true)
    try {
      const location = await getCurrentLocation()

      // Use reverse geocoding to get actual address
      let address = 'Current Location'
      try {
        address = await getCurrentAddress(location.lat, location.lon)
      } catch (error) {
        console.log('Could not get address for current location')
      }

      setQuery(address)
      onLocationSelect({
        lat: location.lat,
        lon: location.lon,
        address: address
      })
    } catch (error) {
      console.error('Location error:', error)
      alert('Unable to get your current location. Please check your browser permissions.')
    } finally {
      setIsLoadingLocation(false)
    }
  }

  // Clear search
  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setGeocodeSuggestions([])
    setShowSuggestions(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0 || geocodeSuggestions.length > 0) {
                  setShowSuggestions(true)
                }
              }}
              placeholder={placeholder}
              className="pl-10 pr-10"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
            )}
          </div>

          {/* Quick Navigation Helper */}
          {query.length >= 3 && !showSuggestions && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm text-blue-800 mb-2">
                💡 <strong>Tip:</strong> Search for any location above, then click "Navigate Here" to get turn-by-turn directions from your current location!
              </div>
            </div>
          )}

          {/* Debug Info */}
          {query.length >= 3 && (
            <div className="mt-1 text-xs text-gray-500">
              Debug: {suggestions.length} legacy results, {geocodeSuggestions.length} new results,
              showing: {showSuggestions ? 'yes' : 'no'},
              using: {useNewGeocoding ? 'new' : 'legacy'} API
            </div>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && (suggestions.length > 0 || geocodeSuggestions.length > 0) && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {/* Toggle between old and new geocoding */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <span className="text-xs text-gray-600">Search Results</span>
                <button
                  onClick={() => setUseNewGeocoding(!useNewGeocoding)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {useNewGeocoding ? 'Use Legacy' : 'Use New API'}
                </button>
              </div>

              {/* New Geocoding Results */}
              {useNewGeocoding && geocodeSuggestions.map((result, index) => (
                <div
                  key={`geocode-${index}`}
                  className={`border-b border-gray-100 last:border-b-0 ${
                    index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 p-4">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {result.formatted}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {result.city && result.state ? `${result.city}, ${result.state}` : result.address}
                      </div>
                      <div className="text-xs text-blue-600 mb-2">
                        Confidence: {Math.round(result.confidence * 100)}% • {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => handleGeocodeSelect(result)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Select Location
                        </Button>
                        <Button
                          onClick={() => handleNavigateToLocation({
                            lat: result.latitude,
                            lon: result.longitude,
                            name: result.formatted,
                            address: result.address || result.formatted
                          })}
                          variant="default"
                          size="sm"
                          className="text-xs bg-blue-600 hover:bg-blue-700"
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Navigate Here
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Original API Results */}
              {!useNewGeocoding && suggestions.map((place, index) => (
                <div
                  key={place.place_id}
                  className={`border-b border-gray-100 last:border-b-0 ${
                    index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 p-4">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {place.display_name}
                      </div>
                      <div className="text-sm text-gray-500 truncate mb-2">
                        {formatAddress(place)}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={() => handleSuggestionSelect(place)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <MapPin className="h-3 w-3 mr-1" />
                          Select Location
                        </Button>
                        <Button
                          onClick={() => handleNavigateToLocation({
                            lat: place.lat,
                            lon: place.lon,
                            name: place.display_name,
                            address: formatAddress(place)
                          })}
                          variant="default"
                          size="sm"
                          className="text-xs bg-blue-600 hover:bg-blue-700"
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Navigate Here
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* No Results Message */}
              {!isLoading && suggestions.length === 0 && geocodeSuggestions.length === 0 && (
                <div className="px-4 py-3 text-center text-gray-500">
                  <div className="text-sm">No results found for "{query}"</div>
                  <div className="text-xs mt-1">Try a different search term or location</div>
                </div>
              )}
            </div>
          )}

          {/* Show dropdown even when no results to display "no results" message */}
          {showSuggestions && !isLoading && suggestions.length === 0 && geocodeSuggestions.length === 0 && query.length >= 3 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
              <div className="px-4 py-3 text-center text-gray-500">
                <div className="text-sm">No results found for "{query}"</div>
                <div className="text-xs mt-1">Try a different search term or check your spelling</div>
              </div>
            </div>
          )}
        </div>

        {/* Current Location Button */}
        {showCurrentLocationButton && (
          <Button
            onClick={handleCurrentLocation}
            disabled={isLoadingLocation}
            variant="outline"
            className="flex-shrink-0"
          >
            {isLoadingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">
              {isLoadingLocation ? 'Getting...' : 'Current Location'}
            </span>
          </Button>
        )}
      </div>

      {/* Search Tips */}
      {query.length > 0 && query.length < 3 && (
        <div className="mt-2 text-sm text-gray-500">
          Type at least 3 characters to search for addresses
        </div>
      )}
    </div>
  )
}
