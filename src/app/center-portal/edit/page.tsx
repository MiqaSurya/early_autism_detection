'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useToast } from '@/components/ui/use-toast'
import { LogoIcon } from '@/components/ui/logo'
import { 
  ArrowLeft, 
  Save, 
  MapPin, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  FileText,
  Loader2
} from 'lucide-react'

// Dynamically import the map component to avoid SSR issues
const LocationMap = dynamic(() => import('@/components/LocationMap'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">Loading map...</div>
})

interface CenterUser {
  id: string
  email: string
  contact_person: string
  center_name: string
  center_type: 'diagnostic' | 'therapy' | 'support' | 'education'
  address: string
  latitude: number
  longitude: number
  phone?: string
  description?: string
  business_license?: string
  is_verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function CenterEditPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    centerName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    centerType: 'therapy' as 'diagnostic' | 'therapy' | 'support' | 'education',
    description: '',
    businessLicense: ''
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [user, setUser] = useState<CenterUser | null>(null)

  const centerTypes = [
    { value: 'therapy', label: 'Therapy Center' },
    { value: 'diagnostic', label: 'Diagnostic Center' },
    { value: 'support', label: 'Support Center' },
    { value: 'education', label: 'Educational Center' }
  ]

  useEffect(() => {
    loadCenterData()
  }, [])

  const loadCenterData = async () => {
    try {
      // Verify center portal session and get user data
      const response = await fetch('/api/center-portal/verify', {
        method: 'GET',
        credentials: 'include'
      })

      const result = await response.json()

      if (!response.ok || !result.valid) {
        router.push('/center-portal/login')
        return
      }

      const userData = result.user
      setUser(userData)

      // Populate form with current data
      setFormData({
        centerName: userData.center_name || '',
        contactPerson: userData.contact_person || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        latitude: userData.latitude?.toString() || '',
        longitude: userData.longitude?.toString() || '',
        centerType: userData.center_type || 'therapy',
        description: userData.description || '',
        businessLicense: userData.business_license || ''
      })
    } catch (error) {
      console.error('Error loading center data:', error)
      toast({
        title: "Error",
        description: "Failed to load center data. Please try again.",
        variant: "destructive",
      })
      router.push('/center-portal/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.centerName.trim()) newErrors.centerName = 'Center name is required'
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.latitude.trim()) newErrors.latitude = 'Latitude is required'
    if (!formData.longitude.trim()) newErrors.longitude = 'Longitude is required'
    
    // Validate latitude and longitude ranges
    if (formData.latitude.trim()) {
      const lat = parseFloat(formData.latitude)
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude must be between -90 and 90'
      }
    }
    if (formData.longitude.trim()) {
      const lng = parseFloat(formData.longitude)
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Longitude must be between -180 and 180'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSaving(true)

    try {
      // Debug: Check cookies before making request
      console.log('Edit page - Document cookies:', document.cookie)

      const response = await fetch('/api/center-portal/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          centerName: formData.centerName,
          contactPerson: formData.contactPerson,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          centerType: formData.centerType,
          description: formData.description,
          businessLicense: formData.businessLicense
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Update failed')
      }

      toast({
        title: "Success!",
        description: "Your center details have been updated and synchronized across all sites. Users and admins can now see your changes.",
      })

      // Redirect back to dashboard
      router.push('/center-portal/dashboard')
    } catch (error: any) {
      console.error('Update error:', error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update center details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return

    setGeocoding(true)
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`
      )

      if (!response.ok) {
        throw new Error('Geocoding failed')
      }

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const location = data.features[0]
        const lat = location.geometry.coordinates[1]
        const lng = location.geometry.coordinates[0]

        setFormData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString()
        }))

        toast({
          title: "Location Found!",
          description: "Coordinates have been automatically updated based on your address.",
        })
      } else {
        toast({
          title: "Location Not Found",
          description: "No location found for this address. Please try a more specific address or enter coordinates manually.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      toast({
        title: "Geocoding Failed",
        description: "Unable to find coordinates for this address. Please enter them manually or try a different address.",
        variant: "destructive",
      })
    } finally {
      setGeocoding(false)
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }

    // Debounce geocoding - auto-detect location after user stops typing for 1 second
    if (value.trim().length > 10) {
      const timeoutId = setTimeout(() => {
        geocodeAddress(value)
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading center data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => router.push('/center-portal/dashboard')}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
            
            <div className="flex justify-center mb-4">
              <LogoIcon className="h-16 w-16" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Center Details</h1>
            <p className="text-gray-600">Update your center information</p>
            
            <div className="flex justify-center items-center mt-4 space-x-4">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span className="text-sm text-gray-500">Keep Your Information Current</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Center Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Center Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="centerName"
                  value={formData.centerName}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.centerName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter center name"
                />
              </div>
              {errors.centerName && <p className="text-red-500 text-xs mt-1">{errors.centerName}</p>}
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.contactPerson ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter contact person name"
                />
              </div>
              {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Center Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Center Type *
              </label>
              <select
                name="centerType"
                value={formData.centerType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
              >
                {centerTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                {geocoding && (
                  <Loader2 className="absolute right-3 top-3 h-5 w-5 animate-spin text-blue-500" />
                )}
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleAddressChange}
                  rows={3}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                    errors.address ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter complete address (coordinates will be auto-detected)"
                />
              </div>
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              {geocoding && (
                <p className="text-blue-600 text-xs mt-1 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Auto-detecting location...
                </p>
              )}
              <button
                type="button"
                onClick={() => geocodeAddress(formData.address)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                disabled={!formData.address.trim() || geocoding}
              >
                {geocoding ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Finding location...
                  </>
                ) : (
                  <>📍 Get coordinates from address</>
                )}
              </button>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.latitude ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 3.1390"
                />
                {errors.latitude && <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.longitude ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 101.6869"
                />
                {errors.longitude && <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>}
              </div>
            </div>

            {/* Interactive Map */}
            {formData.latitude && formData.longitude && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location on Map
                </label>
                <div className="border border-gray-300 rounded-xl overflow-hidden">
                  <LocationMap
                    latitude={parseFloat(formData.latitude)}
                    longitude={parseFloat(formData.longitude)}
                    onMapClick={handleMapClick}
                    height="300px"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Click on the map to update coordinates</p>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  placeholder="Describe your center's services and specialties..."
                />
              </div>
            </div>

            {/* Business License */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business License Number
              </label>
              <input
                type="text"
                name="businessLicense"
                value={formData.businessLicense}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter business license number (optional)"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Update Center Details
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
