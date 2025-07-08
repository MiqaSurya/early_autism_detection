'use client'

import { useState, useEffect } from 'react'
import { MapPin, RefreshCw, Plus, Edit, Trash2, Save, X, Phone, Globe, Mail, Star, MapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAllAutismCenters, createAutismCenter, updateAutismCenter, deleteAutismCenter, type AutismCenter, type CreateAutismCenterData } from '@/lib/admin-locations'
import { useToast } from '@/hooks/use-toast'
import dynamic from 'next/dynamic'

// Dynamic import for map component to prevent SSR issues
const GeoapifyMap = dynamic(() => import('@/components/map/GeoapifyMap').catch(() => {
  // Return a fallback component if the map fails to load
  return { default: () => null }
}), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full bg-blue-50 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <span className="text-blue-600 text-sm">Loading map...</span>
      </div>
    </div>
  )
})



interface EditingCenter extends Partial<AutismCenter> {
  isNew?: boolean
}

export default function AdminLocationsPage() {
  const { toast } = useToast()
  const [centers, setCenters] = useState<AutismCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingCenter, setEditingCenter] = useState<EditingCenter | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [mapCenter] = useState<[number, number]>([3.1390, 101.6869]) // KL coordinates
  const [selectedMapLocation, setSelectedMapLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Load centers on mount with timeout
  useEffect(() => {
    const loadWithTimeout = async () => {
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.warn('⚠️ Loading timeout, stopping loading state')
          setLoading(false)
          setError('Loading took too long. Please try refreshing the page.')
        }
      }, 10000) // 10 second timeout

      try {
        await loadCenters()
      } finally {
        clearTimeout(timeoutId)
      }
    }

    loadWithTimeout()
  }, [])

  const loadCenters = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      console.log('🔄 Loading centers...')
      const centersData = await getAllAutismCenters()
      console.log('📋 Loaded centers:', centersData.length)

      // Ensure verified field is always boolean
      const normalizedCenters = centersData.map(center => ({
        ...center,
        verified: center.verified || false
      }))
      setCenters(normalizedCenters)
      setLastUpdated(new Date())
      console.log('✅ Centers loaded successfully')
    } catch (err) {
      console.error('❌ Failed to load centers:', err)
      setError('Failed to load autism centers. Please try refreshing the page.')
      // Set empty array to prevent infinite loading
      setCenters([])
    } finally {
      setLoading(false)
    }
  }

  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    setSelectedMapLocation(latlng)
    setShowAddForm(true)
    setError(null)
    setSuccess(null)
    setEditingCenter({
      isNew: true,
      latitude: latlng.lat,
      longitude: latlng.lng,
      name: '',
      type: 'therapy',
      address: '',
      phone: '',
      website: '',
      email: '',
      description: '',
      verified: false
    })
  }

  const handleSaveCenter = async () => {
    if (!editingCenter) return

    // Validate required fields
    if (!editingCenter.name?.trim()) {
      setError('Center name is required')
      return
    }
    if (!editingCenter.address?.trim()) {
      setError('Address is required')
      return
    }
    if (!editingCenter.latitude || !editingCenter.longitude) {
      setError('Latitude and longitude are required')
      return
    }

    try {
      setSaving(true)
      setError(null)

      if (editingCenter.isNew) {
        // Create new center
        const newCenterData: CreateAutismCenterData = {
          name: editingCenter.name.trim(),
          type: editingCenter.type || 'therapy',
          address: editingCenter.address.trim(),
          latitude: editingCenter.latitude,
          longitude: editingCenter.longitude,
          phone: editingCenter.phone?.trim() || undefined,
          website: editingCenter.website?.trim() || undefined,
          email: editingCenter.email?.trim() || undefined,
          description: editingCenter.description?.trim() || undefined,
          verified: editingCenter.verified || false
        }
        await createAutismCenter(newCenterData)
        setSuccess('New autism center created successfully!')
        toast({
          title: "Success",
          description: "New autism center created successfully!",
        })
      } else {
        // Update existing center
        await updateAutismCenter({
          id: editingCenter.id!,
          name: editingCenter.name?.trim(),
          type: editingCenter.type,
          address: editingCenter.address?.trim(),
          latitude: editingCenter.latitude,
          longitude: editingCenter.longitude,
          phone: editingCenter.phone?.trim() || undefined,
          website: editingCenter.website?.trim() || undefined,
          email: editingCenter.email?.trim() || undefined,
          description: editingCenter.description?.trim() || undefined,
          verified: editingCenter.verified
        })
        setSuccess('Autism center updated successfully!')
        toast({
          title: "Success",
          description: "Autism center updated successfully!",
        })
      }

      // Reload centers and close form
      await loadCenters()
      setEditingCenter(null)
      setShowAddForm(false)
      setSelectedMapLocation(null)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to save center:', err)
      setError('Failed to save center. Please try again.')
      toast({
        title: "Error",
        description: "Failed to save center. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCenter = async (centerId: string, centerName: string) => {
    if (!confirm(`Are you sure you want to delete "${centerName}"? This action cannot be undone.`)) return

    try {
      setDeleting(centerId)
      setError(null)
      await deleteAutismCenter(centerId)
      await loadCenters()
      setSuccess('Autism center deleted successfully!')
      toast({
        title: "Success",
        description: `"${centerName}" has been deleted successfully!`,
      })

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to delete center:', err)
      setError('Failed to delete center. Please try again.')
      toast({
        title: "Error",
        description: "Failed to delete center. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
  }

  const handleEditCenter = (center: AutismCenter) => {
    console.log('handleEditCenter called with:', center)
    console.log('Setting editingCenter to:', { ...center, isNew: false })
    setEditingCenter({ ...center, isNew: false })
    setShowAddForm(true)
    setError(null)
    setSuccess(null)
    console.log('Form should now be visible')
  }

  const handleCancelEdit = () => {
    // Check if there are unsaved changes
    const hasChanges = editingCenter && (
      editingCenter.name?.trim() ||
      editingCenter.address?.trim() ||
      editingCenter.phone?.trim() ||
      editingCenter.website?.trim() ||
      editingCenter.email?.trim() ||
      editingCenter.description?.trim()
    )

    if (hasChanges && !confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      return
    }

    setEditingCenter(null)
    setShowAddForm(false)
    setSelectedMapLocation(null)
    setError(null)
    setSuccess(null)
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading admin locations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Autism Centers Management</h1>
            <p className="text-gray-600 mt-2">Manage autism centers, locations, and details</p>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={loadCenters} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => {
                console.log('Add Center button clicked!')
                console.log('Before state change:', { showAddForm, editingCenter })
                setShowAddForm(true)
                setEditingCenter({
                  isNew: true,
                  latitude: mapCenter[0],
                  longitude: mapCenter[1],
                  name: '',
                  type: 'therapy',
                  address: '',
                  phone: '',
                  website: '',
                  email: '',
                  description: '',
                  verified: false
                })
                console.log('After state change - should show form')
              }}
              className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Add Center
            </Button>
          </div>
        </div>

        {/* Success Display */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Centers</p>
                <p className="text-2xl font-bold text-gray-900">{centers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">
                  {centers.filter(c => c.verified).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <MapIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Diagnostic</p>
                <p className="text-2xl font-bold text-gray-900">
                  {centers.filter(c => c.type === 'diagnostic').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <MapIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Therapy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {centers.filter(c => c.type === 'therapy').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Interactive Map</h2>
              </div>
              <p className="text-sm text-gray-600">
                Click on the map to add a new center at that location
              </p>
            </div>
          </div>
          <div className="p-6">
            <div className="h-96 w-full rounded-lg overflow-hidden relative">
              <GeoapifyMap
                centers={centers as any}
                userLocation={undefined}
                onCenterSelect={(center) => handleEditCenter(center as AutismCenter)}
                onClick={handleMapClick}
                className="h-full w-full"
                zoom={11}
              />
              {selectedMapLocation && (
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow text-sm">
                  📍 Selected: {selectedMapLocation.lat.toFixed(4)}, {selectedMapLocation.lng.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(() => {
          console.log('Form render check:', { showAddForm, editingCenter })
          return null
        })()}
        {showAddForm && editingCenter && (
          <div className="bg-white rounded-lg shadow-md mb-8 border-2 border-red-500">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {editingCenter.isNew ? 'Add New Center' : 'Edit Center'}
                </h2>
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Center Name *
                    </label>
                    <Input
                      value={editingCenter.name || ''}
                      onChange={(e) => {
                        setEditingCenter({ ...editingCenter, name: e.target.value })
                        setError(null) // Clear error when user starts typing
                      }}
                      placeholder="Enter center name"
                      className={!editingCenter.name?.trim() && error ? 'border-red-300' : ''}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <Select
                      value={editingCenter.type || 'therapy'}
                      onValueChange={(value) => setEditingCenter({ ...editingCenter, type: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diagnostic">Diagnostic</SelectItem>
                        <SelectItem value="therapy">Therapy</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <Textarea
                      value={editingCenter.address || ''}
                      onChange={(e) => {
                        setEditingCenter({ ...editingCenter, address: e.target.value })
                        setError(null) // Clear error when user starts typing
                      }}
                      placeholder="Enter full address"
                      rows={3}
                      className={!editingCenter.address?.trim() && error ? 'border-red-300' : ''}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude *
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={editingCenter.latitude || ''}
                        onChange={(e) => setEditingCenter({ ...editingCenter, latitude: parseFloat(e.target.value) })}
                        placeholder="3.1390"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude *
                      </label>
                      <Input
                        type="number"
                        step="any"
                        value={editingCenter.longitude || ''}
                        onChange={(e) => setEditingCenter({ ...editingCenter, longitude: parseFloat(e.target.value) })}
                        placeholder="101.6869"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <Input
                      value={editingCenter.phone || ''}
                      onChange={(e) => setEditingCenter({ ...editingCenter, phone: e.target.value })}
                      placeholder="+60 3-1234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <Input
                      value={editingCenter.website || ''}
                      onChange={(e) => setEditingCenter({ ...editingCenter, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={editingCenter.email || ''}
                      onChange={(e) => setEditingCenter({ ...editingCenter, email: e.target.value })}
                      placeholder="contact@center.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <Textarea
                      value={editingCenter.description || ''}
                      onChange={(e) => setEditingCenter({ ...editingCenter, description: e.target.value })}
                      placeholder="Brief description of the center"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="verified"
                      checked={editingCenter.verified || false}
                      onChange={(e) => setEditingCenter({ ...editingCenter, verified: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="verified" className="text-sm font-medium text-gray-700">
                      Verified Center
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    console.log('Save button clicked!', editingCenter)
                    handleSaveCenter()
                  }}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      {editingCenter.isNew ? 'Creating...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingCenter.isNew ? 'Create Center' : 'Update Center'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Centers List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">All Centers ({centers.length})</h2>
              </div>
              <p className="text-sm text-gray-600">
                Click on a center to edit, or click on the map marker
              </p>
            </div>
          </div>
          <div className="p-6">
            {centers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No centers found</h3>
                <p className="text-sm mb-4">Add your first autism center by clicking on the map or using the Add Center button.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                {centers.map((center) => (
                  <div key={center.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{center.name}</h3>
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
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log('Edit button clicked for center:', center)
                            handleEditCenter(center)
                          }}
                          className="flex items-center gap-1 bg-yellow-100 border-yellow-300"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCenter(center.id, center.name)}
                          disabled={deleting === center.id}
                          className="flex items-center gap-1 border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          {deleting === center.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{center.address}</p>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>📍 {center.latitude.toFixed(4)}, {center.longitude.toFixed(4)}</span>
                      </div>

                      {center.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{center.phone}</span>
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
                          <span className="text-sm text-gray-600">{center.email}</span>
                        </div>
                      )}

                      {center.description && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">{center.description}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                        Created: {new Date(center.created_at).toLocaleDateString()}
                        {center.updated_at && (
                          <span className="ml-4">
                            Updated: {new Date(center.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
