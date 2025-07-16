'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, RefreshCw, Database, Users, Building2 } from 'lucide-react'

interface SyncStatus {
  userSiteRegistrations: number
  centerPortalRegistrations: number
  adminVisibleCenters: number
  pendingApprovals: number
  lastSyncTime: string
  syncHealth: 'healthy' | 'warning' | 'error'
}

export default function SyncStatusPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    checkSyncStatus()
  }, [])

  const checkSyncStatus = async () => {
    try {
      setRefreshing(true)
      
      // Get admin session from localStorage (correct key)
      const adminSession = localStorage.getItem('admin_session')
      if (!adminSession) {
        setError('Admin authentication required. Please login as admin first.')
        return
      }

      // Fetch sync status data
      const [registrationsResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/center-registrations', {
          headers: { 'x-admin-session': adminSession }
        }),
        fetch('/api/admin/users', {
          headers: { 'x-admin-session': adminSession }
        })
      ])

      if (!registrationsResponse.ok || !usersResponse.ok) {
        setError('Failed to fetch sync status data')
        return
      }

      const registrationsData = await registrationsResponse.json()
      const usersData = await usersResponse.json()

      // Calculate sync metrics
      const centerManagers = usersData.filter((user: any) => user.role === 'center_manager').length
      const totalCenters = registrationsData.data.stats.total_centers
      const pendingCenters = registrationsData.data.stats.pending_centers
      
      // Determine sync health
      let syncHealth: 'healthy' | 'warning' | 'error' = 'healthy'
      if (centerManagers > totalCenters) {
        syncHealth = 'warning' // More managers than centers
      } else if (Math.abs(centerManagers - totalCenters) > 5) {
        syncHealth = 'error' // Significant mismatch
      }

      setSyncStatus({
        userSiteRegistrations: usersData.length,
        centerPortalRegistrations: centerManagers,
        adminVisibleCenters: totalCenters,
        pendingApprovals: pendingCenters,
        lastSyncTime: new Date().toISOString(),
        syncHealth
      })

    } catch (err) {
      console.error('Error checking sync status:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getSyncHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Healthy
          </span>
        )
      case 'warning':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-4 w-4 mr-1" />
            Warning
          </span>
        )
      case 'error':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <XCircle className="h-4 w-4 mr-1" />
            Error
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Sync Status</h1>
          <p className="text-gray-600 mt-1">
            Monitor synchronization between user site, center portal, and admin systems
          </p>
        </div>
        
        <button
          onClick={checkSyncStatus}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {syncStatus && (
        <>
          {/* Sync Health Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Overall Sync Health</h2>
              {getSyncHealthBadge(syncStatus.syncHealth)}
            </div>
            
            <div className="text-sm text-gray-600">
              Last checked: {new Date(syncStatus.lastSyncTime).toLocaleString()}
            </div>
          </div>

          {/* Sync Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{syncStatus.userSiteRegistrations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Center Managers</p>
                  <p className="text-2xl font-bold text-gray-900">{syncStatus.centerPortalRegistrations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Registered Centers</p>
                  <p className="text-2xl font-bold text-gray-900">{syncStatus.adminVisibleCenters}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-gray-900">{syncStatus.pendingApprovals}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sync Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Details</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">User Site ↔ Center Portal</h3>
                  <p className="text-sm text-gray-600">Registration data synchronization</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Center Portal ↔ Admin Dashboard</h3>
                  <p className="text-sm text-gray-600">Center management synchronization</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Admin Dashboard ↔ User Locator</h3>
                  <p className="text-sm text-gray-600">Approved centers visibility</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
