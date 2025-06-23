'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Loader2, X } from 'lucide-react'
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
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<GeoapifyPlace[]>([])
  const [geocodeSuggestions, setGeocodeSuggestions] = useState<GeocodeResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [useNewGeocoding, setUseNewGeocoding] = useState(true)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

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
          setGeocodeSuggestions(results)
          setSuggestions([]) // Clear old suggestions
        } else {
          // Use original API
          const results = await getAutocompleteSuggestions(query)
          setSuggestions(results)
          setGeocodeSuggestions([]) // Clear new suggestions
        }
        setShowSuggestions(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Search error:', error)
        setSuggestions([])
        setGeocodeSuggestions([])
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
                <button
                  key={`geocode-${index}`}
                  onClick={() => handleGeocodeSelect(result)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {result.formatted}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {result.city && result.state ? `${result.city}, ${result.state}` : result.address}
                      </div>
                      <div className="text-xs text-blue-600">
                        Confidence: {Math.round(result.confidence * 100)}% • {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {/* Original API Results */}
              {!useNewGeocoding && suggestions.map((place, index) => (
                <button
                  key={place.place_id}
                  onClick={() => handleSuggestionSelect(place)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {place.display_name}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {formatAddress(place)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
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
