'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, Users, FileText, MapPin, Calendar, RefreshCw } from 'lucide-react'
import { getAnalyticsData, type AnalyticsData } from '@/lib/admin-db'

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    keyMetrics: {
      totalUsers: 0,
      totalAssessments: 0,
      locationSearches: 0,
      avgSessionTime: '0m',
      userGrowth: '0%',
      assessmentGrowth: '0%',
      locationGrowth: '0%',
      sessionGrowth: '0%'
    },
    userGrowthData: [],
    riskDistribution: { low: 0, medium: 0, high: 0, total: 0 },
    popularLocations: [],
    timeRange: '30d'
  })
  const [loading, setLoading] = useState(true)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)

  const loadAnalyticsData = useCallback(async (selectedTimeRange?: '7d' | '30d' | '90d') => {
    try {
      const range = selectedTimeRange || timeRange
      const data = await getAnalyticsData(range)
      setAnalytics(data)
    } catch (error) {
      console.error('Error loading analytics data:', error)
    }
  }, [timeRange])

  useEffect(() => {
    const initializeAnalytics = async () => {
      setLoading(true)
      await loadAnalyticsData()
      setLoading(false)
      setIsRealTimeConnected(true) // Set as connected since we're using polling
    }

    initializeAnalytics()

    // Set up polling instead of WebSocket subscriptions
    const pollingInterval = setInterval(() => {
      console.log('Polling analytics data...')
      loadAnalyticsData()
    }, 45000) // Poll every 45 seconds for analytics

    // Cleanup function
    return () => {
      clearInterval(pollingInterval)
    }
  }, [loadAnalyticsData])

  // Handle time range changes
  useEffect(() => {
    if (!loading) {
      loadAnalyticsData(timeRange)
    }
  }, [timeRange, loading, loadAnalyticsData])

  const riskDistribution = [
    { label: 'Low Risk', value: analytics.riskDistribution.low, color: 'bg-green-500' },
    { label: 'Medium Risk', value: analytics.riskDistribution.medium, color: 'bg-yellow-500' },
    { label: 'High Risk', value: analytics.riskDistribution.high, color: 'bg-red-500' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Platform usage statistics and insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Loading Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="p-3 bg-gray-200 rounded-lg">
                  <div className="h-6 w-6 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Loading Popular Locations */}
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isRealTimeConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-500">
                {isRealTimeConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            Platform usage statistics and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true)
              loadAnalyticsData().finally(() => setLoading(false))
            }}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.keyMetrics.totalUsers}</p>
              <p className={`text-sm mt-1 ${analytics.keyMetrics.userGrowth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.keyMetrics.userGrowth} from last month
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assessments</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.keyMetrics.totalAssessments}</p>
              <p className={`text-sm mt-1 ${analytics.keyMetrics.assessmentGrowth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.keyMetrics.assessmentGrowth} from last month
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Location Searches</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.keyMetrics.locationSearches}</p>
              <p className={`text-sm mt-1 ${analytics.keyMetrics.locationGrowth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.keyMetrics.locationGrowth} from last month
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Session Time</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.keyMetrics.avgSessionTime}</p>
              <p className={`text-sm mt-1 ${analytics.keyMetrics.sessionGrowth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.keyMetrics.sessionGrowth} from last month
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h2>
          {analytics.userGrowthData.length > 0 ? (
            <div className="space-y-4">
              {analytics.userGrowthData.map((point, index) => {
                const maxUsers = Math.max(...analytics.userGrowthData.map(p => p.users)) || 100
                return (
                  <div key={point.date} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {new Date(point.date).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.max(5, (point.users / maxUsers) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">{point.users}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm">No growth data available for this time range</p>
            </div>
          )}
        </div>

        {/* Assessment Risk Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Risk Distribution</h2>
          {analytics.riskDistribution.total > 0 ? (
            <div className="space-y-4">
              {riskDistribution.map((risk) => (
                <div key={risk.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${risk.color}`}></div>
                    <span className="text-sm text-gray-700">{risk.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`${risk.color} h-2 rounded-full`}
                        style={{ width: `${analytics.riskDistribution.total > 0 ? (risk.value / analytics.riskDistribution.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{risk.value}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm">No assessment data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Popular Locations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Searched Locations</h2>
        {analytics.popularLocations.length > 0 ? (
          <div className="space-y-4">
            {analytics.popularLocations.map((location, index) => {
              const maxVisits = Math.max(...analytics.popularLocations.map(l => l.visits)) || 100
              return (
                <div key={location.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <span className="text-sm text-gray-900">{location.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.max(10, (location.visits / maxVisits) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8">{location.visits}</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm">No location data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
