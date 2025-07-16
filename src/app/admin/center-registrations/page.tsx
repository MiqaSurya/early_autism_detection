'use client'

import { useState, useEffect } from 'react'
import { Building2, CheckCircle, Clock, XCircle, Users, Calendar, MapPin, Phone, Mail, Globe } from 'lucide-react'
import AdminAuthWrapper from '@/components/admin/AdminAuthWrapper'
import PollingStatus, { usePollingStatus } from '@/components/admin/PollingStatus'
import { useAdminCenterSync } from '@/hooks/useAdminCenterSync'

interface CenterRegistration {
  center_id: string
  center_name: string
  center_type: string
  manager_name: string
  manager_email: string
  registration_date: string
  is_verified: boolean
  contact_person: string
}

interface RegistrationStats {
  total_centers: number
  verified_centers: number
  pending_centers: number
  new_centers_30d: number
  total_center_managers: number
}

export default function CenterRegistrationsPage() {
  const [registrations, setRegistrations] = useState<CenterRegistration[]>([])
  const [stats, setStats] = useState<RegistrationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const pollingStatus = usePollingStatus(30000) // 30 second polling

  // Enhanced real-time sync for admin center updates
  const {
    isConnected: syncConnected,
    lastUpdate: syncLastUpdate,
    error: syncError,
    connectionType,
    forceRefresh: syncForceRefresh
  } = useAdminCenterSync({
    onCentersUpdated: () => {
      console.log('Admin: Centers updated, refreshing registration data...')
      fetchRegistrations()
    },
    onError: (error) => {
      console.error('Admin sync error:', error)
    },
    enableRealtime: true
  })

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)

      // Get admin session from localStorage (correct key)
      const adminSession = localStorage.getItem('admin_session')
      if (!adminSession) {
        setError('Admin authentication required. Please login as admin first.')
        return
      }

      const response = await fetch('/api/admin/center-registrations', {
        headers: {
          'x-admin-session': adminSession
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch registrations')
        return
      }

      const data = await response.json()
      setRegistrations(data.data.registrations || [])
      setStats(data.data.stats || null)
      pollingStatus.updateStatus() // Update polling status on successful fetch
    } catch (err) {
      console.error('Error fetching registrations:', err)
      setError('An unexpected error occurred')
      pollingStatus.setDisconnected() // Mark as disconnected on error
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationAction = async (centerId: string, action: 'approve' | 'reject' | 'pending') => {
    try {
      setProcessingId(centerId)

      const adminSession = localStorage.getItem('admin_session')
      if (!adminSession) {
        setError('Admin authentication required. Please login as admin first.')
        return
      }

      const response = await fetch('/api/admin/center-registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': adminSession
        },
        body: JSON.stringify({
          centerId,
          action,
          notes: `${action} by admin`
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert('Error: ' + (errorData.error || 'Failed to update center'))
        return
      }

      // Refresh the data
      await fetchRegistrations()
      alert(`Center ${action} successfully!`)
    } catch (err) {
      console.error('Error updating center:', err)
      alert('An unexpected error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (isVerified: boolean) => {
    if (isVerified) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </span>
      )
    }
  }

  const getCenterTypeLabel = (type: string) => {
    const types = {
      diagnostic: 'Diagnostic Center',
      therapy: 'Therapy Center',
      support: 'Support Center',
      education: 'Educational Center'
    }
    return types[type as keyof typeof types] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AdminAuthWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Center Registrations</h1>
              <p className="text-gray-600 mt-1">
                Manage autism center registrations and verification status
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Enhanced Sync Status */}
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                {syncConnected ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">
                      {connectionType === 'websocket' ? 'Real-time' : 'Auto-sync'}
                    </span>
                    {syncLastUpdate && (
                      <span className="text-xs text-gray-500">
                        • {syncLastUpdate.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                ) : syncError ? (
                  <div className="flex items-center gap-1 text-amber-600">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm">Sync issue</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-500">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm">Connecting...</span>
                  </div>
                )}
              </div>
              <PollingStatus
                isConnected={pollingStatus.isConnected}
                lastUpdate={pollingStatus.lastUpdate}
                interval={pollingStatus.interval}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Centers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_centers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">{stats.verified_centers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_centers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New (30d)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.new_centers_30d}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-lg">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Managers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_center_managers}</p>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Registrations List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Registrations</h2>
          </div>

          <div className="divide-y divide-gray-200">
          {registrations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations found</h3>
              <p className="text-gray-600">
                No center registrations have been submitted recently.
              </p>
            </div>
          ) : (
            registrations.map((registration, index) => (
              <div key={registration.center_id || `registration-${index}`} className="px-6 py-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 mr-3">
                        {registration.center_name}
                      </h3>
                      {getStatusBadge(registration.is_verified)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Building2 className="h-4 w-4 mr-2" />
                          {getCenterTypeLabel(registration.center_type)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          Manager: {registration.manager_name}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {registration.manager_email}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          Contact: {registration.contact_person}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Registered: {new Date(registration.registration_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {!registration.is_verified && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleVerificationAction(registration.center_id, 'approve')}
                          disabled={processingId === registration.center_id}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingId === registration.center_id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleVerificationAction(registration.center_id, 'reject')}
                          disabled={processingId === registration.center_id}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {registration.is_verified && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleVerificationAction(registration.center_id, 'pending')}
                          disabled={processingId === registration.center_id}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Mark as Pending
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      </div>
    </AdminAuthWrapper>
  )
}
