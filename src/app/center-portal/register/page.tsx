'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { LogoIcon } from '@/components/ui/logo'
import { Eye, EyeOff, User, Mail, Lock, Building2, Phone, MapPin, ArrowLeft } from 'lucide-react'

// Dynamically import the map component to avoid SSR issues
const LocationMap = dynamic(() => import('@/components/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">Loading map...</div>
})

export default function CenterRegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    centerName: '',
    contactPerson: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    centerType: 'therapy',
    description: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const centerTypes = [
    { value: 'therapy', label: 'Therapy Center' },
    { value: 'diagnostic', label: 'Diagnostic Center' },
    { value: 'support', label: 'Support Center' },
    { value: 'education', label: 'Educational Center' }
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.centerName.trim()) newErrors.centerName = 'Center name is required'
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
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

    setLoading(true)

    try {
      // Validate coordinates before sending
      const lat = parseFloat(formData.latitude)
      const lng = parseFloat(formData.longitude)

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error('Invalid coordinates. Please ensure latitude and longitude are valid numbers.')
      }

      console.log('📤 Sending registration request:', {
        email: formData.email,
        centerName: formData.centerName,
        centerType: formData.centerType,
        latitude: lat,
        longitude: lng,
        hasPassword: !!formData.password
      })

      // Call the center portal registration API
      const response = await fetch('/api/center-portal/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          contactPerson: formData.contactPerson,
          centerName: formData.centerName,
          centerType: formData.centerType,
          address: formData.address,
          latitude: lat,
          longitude: lng,
          phone: formData.phone,
          description: formData.description
        })
      })

      const result = await response.json()

      console.log('📥 Registration response:', {
        ok: response.ok,
        status: response.status,
        result
      })

      if (!response.ok) {
        console.error('❌ Registration failed:', result)
        throw new Error(result.error || 'Registration failed')
      }

      toast({
        title: "Registration Successful!",
        description: "Your center has been registered successfully. You can now log in.",
      })

      // Redirect to success page
      router.push('/center-portal/register/success')
    } catch (error: any) {
      console.error('Registration error:', error)

      let errorMessage = error.message || "An error occurred during registration"
      let errorTitle = "Registration Failed"

      if (error.message && error.message.includes('already registered')) {
        errorTitle = "Email Already Registered"
        errorMessage = "This email is already registered. Please use the center login page or try a different email address."
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }))
  }

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return

    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`
      )

      if (!response.ok) throw new Error('Geocoding failed')

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].geometry.coordinates
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }))

        toast({
          title: "Location Found!",
          description: "Coordinates have been automatically set based on your address.",
        })
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      toast({
        title: "Geocoding Failed",
        description: "Could not find coordinates for this address. Please enter them manually.",
        variant: "destructive",
      })
    }
  }

  const handleAddressChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }

    // Debounce geocoding
    if (value.trim().length > 10) {
      const timeoutId = setTimeout(() => {
        geocodeAddress(value)
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/auth/login" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            
            <div className="flex justify-center mb-4">
              <LogoIcon className="h-16 w-16" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Register Your Center</h1>
            <p className="text-gray-600 text-sm">Join our network of autism support centers</p>
            <div className="flex justify-center items-center mt-3 text-xs text-blue-600">
              <span className="w-2 h-2 bg-red-400 rounded-full mr-1"></span>
              <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
              <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              <span>Supporting Every Center's Mission</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Enter your center name"
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

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleAddressChange}
                  rows={2}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                    errors.address ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter center address"
                />
              </div>
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              <button
                type="button"
                onClick={() => geocodeAddress(formData.address)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                disabled={!formData.address.trim()}
              >
                📍 Get coordinates from address
              </button>
            </div>

            {/* Latitude and Longitude */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Latitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    step="any"
                    min="-90"
                    max="90"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.latitude ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 3.1390"
                  />
                </div>
                {errors.latitude && <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>}
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    step="any"
                    min="-180"
                    max="180"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.longitude ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., 101.6869"
                  />
                </div>
                {errors.longitude && <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>}
              </div>
            </div>

            {/* Interactive Map */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location on Map
              </label>
              <div className="border rounded-xl overflow-hidden">
                <LocationMap
                  latitude={parseFloat(formData.latitude) || 3.1390}
                  longitude={parseFloat(formData.longitude) || 101.6869}
                  onMapClick={handleMapClick}
                  height="300px"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Click on the map to set your center's location, or enter coordinates manually above.
              </p>
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
                {centerTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register Center'}
            </button>
          </form>

          {/* Help Section */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-800 text-sm mb-2">Already have an account?</h4>
            <p className="text-blue-700 text-xs mb-3">
              If you've already registered with this email (either as a user or center), please use the login page instead.
            </p>
            <Link
              href="/center-portal/login"
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold text-sm"
            >
              Go to Center Login →
            </Link>
          </div>

          <div className="mt-4 text-center">
            <p className="text-gray-600 text-sm">
              Need help?{' '}
              <a href="mailto:support@autismdetector.com" className="text-blue-600 hover:text-blue-800 font-semibold">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
