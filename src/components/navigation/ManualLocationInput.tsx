'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { MapPin, Search, X } from 'lucide-react'
import { geocodeAddress } from '@/lib/geocoding'

interface ManualLocationInputProps {
  onLocationSelect: (location: { lat: number; lon: number; address: string }) => void
  onClose: () => void
  destinationName: string
}

export default function ManualLocationInput({ 
  onLocationSelect, 
  onClose, 
  destinationName 
}: ManualLocationInputProps) {
  const [address, setAddress] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!address.trim()) return

    setIsSearching(true)
    setError(null)
    setSearchResults([])

    try {
      const results = await geocodeAddress(address)

      if (results && results.length > 0) {
        setSearchResults(results.slice(0, 5)) // Show top 5 results
      } else {
        setError('No locations found. Please try a different address.')
      }
    } catch (err) {
      console.error('Geocoding error:', err)
      setError('Unable to search for locations. Please check your internet connection.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectResult = (result: any) => {
    onLocationSelect({
      lat: result.latitude,
      lon: result.longitude,
      address: result.formatted || result.display_name || address
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Enter Your Location</h2>
              <p className="text-sm text-gray-600">
                To navigate to {destinationName}
              </p>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Input */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter your address or location"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !address.trim()}
              >
                {isSearching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Select your location:</h3>
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectResult(result)}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm">
                      {result.formatted}
                    </div>
                    {result.country && (
                      <div className="text-xs text-gray-500 mt-1">
                        {result.country}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Tips:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Enter your full address for best results</li>
                <li>• Include city and state/country if needed</li>
                <li>• Try landmarks or business names nearby</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
