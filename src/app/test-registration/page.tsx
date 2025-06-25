'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function TestRegistrationPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError)
        setLoading(false)
        return
      }

      setUser(user)

      if (user) {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error getting profile:', profileError)
        } else {
          setProfile(profile)
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Registration Test Page</h1>
      
      {!user ? (
        <div className="space-y-4">
          <p>No user logged in.</p>
          <div className="space-x-4">
            <Button onClick={() => window.location.href = '/auth/login'}>
              Go to Login
            </Button>
            <Button onClick={() => window.location.href = '/auth/register'}>
              Go to Register
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            ✅ User is logged in!
          </div>

          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">User Information</h2>
            <div className="space-y-2">
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Email Verified:</strong> {user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
            </div>
          </div>

          {profile && (
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
              <div className="space-y-2">
                <p><strong>Display Name:</strong> {profile.display_name || 'Not set'}</p>
                <p><strong>Email in Profile:</strong> {profile.email || 'Not set'}</p>
                <p><strong>Email Verified in Profile:</strong> {profile.email_verified ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Profile Created:</strong> {new Date(profile.created_at).toLocaleString()}</p>
                <p><strong>Profile Updated:</strong> {new Date(profile.updated_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          {!profile && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              ⚠️ No profile found for this user
            </div>
          )}

          <div className="space-x-4">
            <Button onClick={checkUser}>
              Refresh Data
            </Button>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
            <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
