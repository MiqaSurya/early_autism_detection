'use client'

import { useState, useEffect } from 'react'
import { Users, FileText, MapPin, TrendingUp, Activity, AlertCircle, RefreshCw } from 'lucide-react'
import { getAdminStats, getRecentActivities, getSystemAlerts, type AdminStats, type RecentActivity, type SystemAlert } from '@/lib/admin-db'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalAssessments: 0,
    totalLocations: 0,
    activeUsers: 0,
    userGrowth: '0%',
    assessmentGrowth: '0%',
    locationGrowth: '0%',
    activeUserGrowth: '0%'
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)

  const loadDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [statsData, activitiesData, alertsData] = await Promise.all([
        getAdminStats(),
        getRecentActivities(),
        getSystemAlerts()
      ])

      setStats(statsData)
      setRecentActivities(activitiesData)
      setAlerts(alertsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true)
      await loadDashboardData()
      setLoading(false)

      // Initialize Supabase client on client-side only
      const { supabase } = await import('@/lib/supabase')

      // Set up real-time subscriptions for live updates
      const subscriptions: any[] = []

      // Subscribe to new assessments
      const assessmentSubscription = supabase
        .channel('admin-assessments')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'assessments' },
          () => {
            loadDashboardData()
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsRealTimeConnected(true)
          }
        })

      subscriptions.push(assessmentSubscription)

      // Subscribe to new children (indicates new users)
      const childrenSubscription = supabase
        .channel('admin-children')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'children' },
          () => {
            loadDashboardData()
          }
        )
        .subscribe()

      subscriptions.push(childrenSubscription)

      // Subscribe to autism centers changes
      const centersSubscription = supabase
        .channel('admin-centers')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'autism_centers' },
          () => {
            loadDashboardData()
          }
        )
        .subscribe()

      subscriptions.push(centersSubscription)

      // Return cleanup function
      return () => {
        subscriptions.forEach(subscription => {
          supabase.removeChannel(subscription)
        })
      }
    }

    let cleanup: (() => void) | undefined

    initializeDashboard().then((cleanupFn) => {
      cleanup = cleanupFn
    })

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [])

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: stats.userGrowth
    },
    {
      title: 'Assessments Completed',
      value: stats.totalAssessments,
      icon: FileText,
      color: 'bg-green-500',
      change: stats.assessmentGrowth
    },
    {
      title: 'Autism Centers',
      value: stats.totalLocations,
      icon: MapPin,
      color: 'bg-purple-500',
      change: stats.locationGrowth
    },
    {
      title: 'Active Users (24h)',
      value: stats.activeUsers,
      icon: Activity,
      color: 'bg-orange-500',
      change: stats.activeUserGrowth
    }
  ]



  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage the Early Autism Detector platform
          </p>
        </div>

        {/* Loading State */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isRealTimeConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-500">
                {isRealTimeConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            Monitor and manage the Early Autism Detector platform
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true)
            loadDashboardData().finally(() => setLoading(false))
          }}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'registration' ? 'bg-blue-500' :
                        activity.type === 'assessment' ? 'bg-green-500' :
                        activity.type === 'location' ? 'bg-purple-500' :
                        'bg-orange-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.user}</p>
                    </div>
                    <div className="text-sm text-gray-400">{activity.time}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No recent activities</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <AlertCircle className={`h-5 w-5 ${
                        alert.type === 'warning' ? 'text-yellow-500' :
                        alert.type === 'info' ? 'text-blue-500' : 'text-green-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{alert.message}</p>
                      <p className="text-sm text-gray-500">{alert.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No system alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <Users className="h-6 w-6 text-blue-500 mb-2" />
            <h3 className="font-medium text-gray-900">Manage Users</h3>
            <p className="text-sm text-gray-600">View and manage user accounts</p>
          </button>
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <TrendingUp className="h-6 w-6 text-green-500 mb-2" />
            <h3 className="font-medium text-gray-900">View Analytics</h3>
            <p className="text-sm text-gray-600">Check platform usage statistics</p>
          </button>
          <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <MapPin className="h-6 w-6 text-purple-500 mb-2" />
            <h3 className="font-medium text-gray-900">Manage Locations</h3>
            <p className="text-sm text-gray-600">Add or update autism centers</p>
          </button>
        </div>
      </div>
    </div>
  )
}
