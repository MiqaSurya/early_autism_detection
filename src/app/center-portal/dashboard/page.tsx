'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { LogoIcon } from '@/components/ui/logo'
import {
  Building2,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  LogOut,
  Edit
} from 'lucide-react'

interface CenterData {
  id: string
  name: string
  type: string
  address: string
  phone: string
  email: string
  description: string
  contact_person: string
  is_verified: boolean
  created_at: string
}

export default function CenterPortalDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [centerData, setCenterData] = useState<CenterData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)


  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      // Verify center portal session
      const response = await fetch('/api/center-portal/verify', {
        method: 'GET',
        credentials: 'include'
      })

      const result = await response.json()

      if (!response.ok || !result.valid) {
        router.push('/center-portal/login')
        return
      }

      setUser(result.user)

      // Load center data - for now we'll use the user data from the center_users table
      // Later we can create a separate autism_centers record linked to center_user_id
      setCenterData({
        id: result.user.id,
        name: result.user.center_name,
        type: result.user.center_type,
        address: result.user.address,
        phone: result.user.phone || '',
        email: result.user.email,
        description: result.user.description || '',
        contact_person: result.user.contact_person,
        is_verified: result.user.is_verified,
        created_at: result.user.created_at
      })
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/center-portal/login')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      // Call the center portal logout API
      await fetch('/api/center-portal/logout', {
        method: 'POST',
        credentials: 'include'
      })

      router.push('/center-portal/login')
    } catch (error) {
      console.error('Sign out error:', error)
      router.push('/center-portal/login') // Redirect anyway
    }
  }



  const getStatusColor = (isVerified: boolean) => {
    return isVerified ? 'text-green-600' : 'text-yellow-600'
  }

  const getStatusIcon = (isVerified: boolean) => {
    return isVerified ? CheckCircle : Clock
  }

  const getStatusText = (isVerified: boolean) => {
    return isVerified ? 'Verified' : 'Pending Verification'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <LogoIcon className="h-16 w-16 mx-auto mb-4" />
          <p className="text-gray-600">Loading your center dashboard...</p>
        </div>
      </div>
    )
  }

  if (!centerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Center Found</h1>
          <p className="text-gray-600 mb-4">No center is associated with your account.</p>
          <button
            onClick={() => router.push('/center-portal/register')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Register Your Center
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <LogoIcon className="h-10 w-10 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Center Portal</h1>
                <p className="text-sm text-gray-600">Manage your autism center</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {centerData.contact_person}!
          </h2>
          <p className="text-gray-600">
            Manage your center profile and connect with families seeking autism support.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {React.createElement(getStatusIcon(centerData.is_verified), {
                className: `h-8 w-8 ${getStatusColor(centerData.is_verified)} mr-3`
              })}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Center Status: {getStatusText(centerData.is_verified)}
                </h3>
                <p className="text-gray-600 text-sm">
                  {centerData.is_verified 
                    ? 'Your center is verified and visible to families'
                    : 'Your center is pending admin verification'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Center Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Building2 className="h-6 w-6 mr-2 text-blue-600" />
              Center Information
            </h3>
            <button
              onClick={() => router.push('/center-portal/edit')}
              className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Details
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start">
                <Building2 className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">{centerData.name}</p>
                  <p className="text-sm text-gray-600 capitalize">{centerData.type} Center</p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-gray-900">{centerData.address}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <p className="text-gray-900">{centerData.phone}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <p className="text-gray-900">{centerData.email}</p>
              </div>

              <div className="flex items-center">
                <Users className="h-5 w-5 text-gray-400 mr-3" />
                <p className="text-gray-900">{centerData.contact_person}</p>
              </div>

              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <p className="text-gray-900">
                  Registered: {new Date(centerData.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {centerData.description && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Description</h4>
              <p className="text-gray-600">{centerData.description}</p>
            </div>
          )}
        </div>


      </div>
    </div>
  )
}
