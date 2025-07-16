'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getAllUsers } from '@/lib/admin-db'

export default function AdminDebugPage() {
  const [debugData, setDebugData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDebugData() {
      try {
        console.log('🔍 Starting debug data fetch...')
        
        // Test direct database queries
        const [profilesResult, childrenResult, assessmentsResult] = await Promise.all([
          supabase.from('profiles').select('id, email, display_name, created_at'),
          supabase.from('children').select('id, parent_id, name, created_at'),
          supabase.from('assessments').select('id, child_id, status, started_at, completed_at')
        ])

        console.log('📊 Direct query results:', {
          profiles: profilesResult,
          children: childrenResult,
          assessments: assessmentsResult
        })

        // Test admin function
        const adminUsers = await getAllUsers()
        console.log('👥 Admin users result:', adminUsers)

        setDebugData({
          profiles: {
            data: profilesResult.data,
            error: profilesResult.error,
            count: profilesResult.data?.length || 0
          },
          children: {
            data: childrenResult.data,
            error: childrenResult.error,
            count: childrenResult.data?.length || 0
          },
          assessments: {
            data: assessmentsResult.data,
            error: assessmentsResult.error,
            count: assessmentsResult.data?.length || 0
          },
          adminUsers: {
            data: adminUsers,
            count: adminUsers.length
          }
        })

      } catch (error) {
        console.error('❌ Debug fetch error:', error)
        setDebugData({ error: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        setLoading(false)
      }
    }

    fetchDebugData()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Debug - Loading...</h1>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Debug Data</h1>
      
      <div className="space-y-6">
        {/* Profiles */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Profiles Table</h2>
          <p className="text-sm text-gray-600 mb-2">Count: {debugData.profiles?.count || 0}</p>
          {debugData.profiles?.error && (
            <p className="text-red-600 text-sm mb-2">Error: {debugData.profiles.error.message}</p>
          )}
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(debugData.profiles?.data?.slice(0, 3), null, 2)}
          </pre>
        </div>

        {/* Children */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Children Table</h2>
          <p className="text-sm text-gray-600 mb-2">Count: {debugData.children?.count || 0}</p>
          {debugData.children?.error && (
            <p className="text-red-600 text-sm mb-2">Error: {debugData.children.error.message}</p>
          )}
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(debugData.children?.data?.slice(0, 3), null, 2)}
          </pre>
        </div>

        {/* Assessments */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Assessments Table</h2>
          <p className="text-sm text-gray-600 mb-2">Count: {debugData.assessments?.count || 0}</p>
          {debugData.assessments?.error && (
            <p className="text-red-600 text-sm mb-2">Error: {debugData.assessments.error.message}</p>
          )}
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(debugData.assessments?.data?.slice(0, 3), null, 2)}
          </pre>
        </div>

        {/* Admin Users Function Result */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Admin Users Function</h2>
          <p className="text-sm text-gray-600 mb-2">Count: {debugData.adminUsers?.count || 0}</p>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(debugData.adminUsers?.data?.slice(0, 3), null, 2)}
          </pre>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">Total Profiles:</p>
              <p className="text-2xl font-bold text-blue-600">{debugData.profiles?.count || 0}</p>
            </div>
            <div>
              <p className="font-medium">Total Children:</p>
              <p className="text-2xl font-bold text-green-600">{debugData.children?.count || 0}</p>
            </div>
            <div>
              <p className="font-medium">Total Assessments:</p>
              <p className="text-2xl font-bold text-purple-600">{debugData.assessments?.count || 0}</p>
            </div>
            <div>
              <p className="font-medium">Admin Users:</p>
              <p className="text-2xl font-bold text-orange-600">{debugData.adminUsers?.count || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
