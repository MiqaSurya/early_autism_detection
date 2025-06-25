'use client'

import { useState, useEffect } from 'react'
import { useSavedLocations } from '@/hooks/use-saved-locations'
import { SavedLocation } from '@/types/location'
import Link from 'next/link'

export default function SavedLocationsPage() {
  const { savedLocations, loading, error, deleteLocation, refreshLocations } = useSavedLocations()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    refreshLocations()
  }, [])

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    await deleteLocation(id)
    setIsDeleting(null)
  }

  // Group locations by type
  const groupedLocations = savedLocations.reduce<Record<string, SavedLocation[]>>(
    (acc, location) => {
      const type = location.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(location)
      return acc
    },
    {}
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Saved Locations</h1>
        <p className="text-neutral-600">
          View and manage your saved treatment centers, support groups, and educational resources.
        </p>
      </div>

      <div className="mb-6">
        <Link href="/dashboard/locator" className="inline-flex items-center gap-2 btn-secondary">
          <span>Find New Locations</span>
        </Link>
      </div>

      {loading ? (
        <div className="card p-6 text-center">
          <p>Loading your saved locations...</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center text-red-600">
          <p>There was an error loading your saved locations. Please try again.</p>
        </div>
      ) : savedLocations.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="mb-4">You haven't saved any locations yet.</p>
          <Link href="/dashboard/locator" className="btn-primary">
            Find Locations
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedLocations).map(([type, locations]) => (
            <div key={type} className="card p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary capitalize">
                {type} Centers
              </h2>
              <div className="divide-y">
                {locations.map((location) => (
                  <div key={location.id} className="py-4">
                    <h3 className="text-lg font-medium">{location.name}</h3>
                    <p className="text-neutral-600 mb-1">{location.address}</p>
                    {location.phone && (
                      <p className="text-neutral-600 mb-1">{location.phone}</p>
                    )}
                    {location.notes && (
                      <p className="text-neutral-600 italic mb-3 text-sm">
                        Notes: {location.notes}
                      </p>
                    )}
                    <div className="flex gap-3 mt-3">
                      <button
                        onClick={() => {
                          const navigationUrl = `/dashboard/navigation?name=${encodeURIComponent(location.name)}&address=${encodeURIComponent(location.address)}&latitude=${location.latitude}&longitude=${location.longitude}&type=${location.type}${location.phone ? `&phone=${encodeURIComponent(location.phone)}` : ''}${location.id ? `&id=${location.id}` : ''}`
                          console.log('Navigating to internal navigation page:', navigationUrl);
                          window.location.href = navigationUrl
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Navigate
                      </button>
                      <button
                        onClick={() => handleDelete(location.id)}
                        disabled={isDeleting === location.id}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        {isDeleting === location.id ? 'Deleting...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 