'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugSessionPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      console.log('🔍 Checking session...')
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      const info = {
        hasSession: !!session,
        user: session?.user || null,
        accessToken: session?.access_token ? 'Present' : 'Missing',
        refreshToken: session?.refresh_token ? 'Present' : 'Missing',
        expiresAt: session?.expires_at || null,
        error: error?.message || null,
        localStorage: typeof window !== 'undefined' ? {
          hasSupabaseAuth: !!localStorage.getItem('sb-nugybnlgrrwzbpjpfmty-auth-token'),
          keys: Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('sb-'))
        } : null
      }
      
      console.log('Session info:', info)
      setSessionInfo(info)
      
    } catch (err) {
      console.error('Session check error:', err)
      setSessionInfo({ error: err instanceof Error ? err.message : String(err) })
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    try {
      setLoading(true)
      console.log('🔐 Attempting login...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'TestPass123!',
      })

      if (error) {
        console.error('Login error:', error)
        alert(`Login failed: ${error.message}`)
        return
      }

      console.log('✅ Login successful, rechecking session...')
      
      // Wait a moment then recheck session
      setTimeout(() => {
        checkSession()
      }, 1000)
      
    } catch (err) {
      console.error('Login error:', err)
      alert(`Login error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      console.log('Signed out')
      checkSession()
    } catch (err) {
      console.error('Sign out error:', err instanceof Error ? err.message : String(err))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Checking session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Session Debug Information</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Session Status</h2>
            <div className="space-y-2">
              <p><strong>Has Session:</strong> {sessionInfo?.hasSession ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Access Token:</strong> {sessionInfo?.accessToken}</p>
              <p><strong>Refresh Token:</strong> {sessionInfo?.refreshToken}</p>
              <p><strong>Expires At:</strong> {sessionInfo?.expiresAt || 'N/A'}</p>
              <p><strong>Error:</strong> {sessionInfo?.error || 'None'}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            {sessionInfo?.user ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {sessionInfo.user.id}</p>
                <p><strong>Email:</strong> {sessionInfo.user.email}</p>
                <p><strong>Email Confirmed:</strong> {sessionInfo.user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Created:</strong> {sessionInfo.user.created_at}</p>
              </div>
            ) : (
              <p className="text-gray-500">No user session</p>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Local Storage</h2>
            {sessionInfo?.localStorage ? (
              <div className="space-y-2">
                <p><strong>Has Auth Token:</strong> {sessionInfo.localStorage.hasSupabaseAuth ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Supabase Keys:</strong></p>
                <ul className="list-disc list-inside text-sm">
                  {sessionInfo.localStorage.keys.map((key: string, index: number) => (
                    <li key={index}>{key}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500">Local storage not available</p>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={checkSession}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Refresh Session Info
              </button>
              
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                Test Login
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
              >
                Sign Out
              </button>
              
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
              >
                Try Dashboard Access
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Raw Session Data</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
