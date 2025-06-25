'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function TestLoginPage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('TestPass123!')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleTestLogin = async () => {
    setLoading(true)
    setMessage('')

    try {
      console.log('🔐 Testing login...')

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Login error:', error)
        setMessage(`Login failed: ${error.message}`)
        return
      }

      console.log('✅ Login successful!')
      console.log('User data:', data.user)

      setMessage('Login successful! Checking session persistence...')

      // Wait for session to be established
      let attempts = 0
      const checkSessionLoop = async () => {
        attempts++
        console.log(`🔍 Checking session... Attempt ${attempts}`)

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (session && session.user) {
          console.log('✅ Session established!')
          console.log('Session user:', session.user.email)
          console.log('Access token:', session.access_token ? 'Present' : 'Missing')

          setMessage(`Session established! User: ${session.user.email}. Redirecting...`)

          // Now try redirect
          setTimeout(() => {
            console.log('🚀 Redirecting to dashboard...')
            router.push('/dashboard')
          }, 1000)

        } else if (attempts < 10) {
          console.log('⏳ Session not ready, retrying...')
          setTimeout(checkSessionLoop, 500)
        } else {
          console.error('❌ Session never established')
          setMessage('Session could not be established after login')
        }
      }

      // Start checking session
      setTimeout(checkSessionLoop, 100)

    } catch (err) {
      console.error('❌ Test failed:', err)
      setMessage(`Test failed: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDirectDashboard = () => {
    console.log('🎯 Direct dashboard access test')
    window.location.href = '/dashboard'
  }

  const handleCheckSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setMessage(`Session error: ${error.message}`)
      } else if (session) {
        setMessage(`Active session found for: ${session.user?.email}`)
        console.log('Session data:', session)
      } else {
        setMessage('No active session')
      }
    } catch (err) {
      setMessage(`Session check failed: ${err}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Login Redirect Test</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <button
            onClick={handleTestLogin}
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing Login...' : 'Test Login & Redirect'}
          </button>
          
          <button
            onClick={handleCheckSession}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            Check Current Session
          </button>
          
          <button
            onClick={handleDirectDashboard}
            className="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
          >
            Test Direct Dashboard Access
          </button>
          
          {message && (
            <div className="p-3 bg-gray-100 rounded text-sm">
              {message}
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-4">
            <p><strong>Instructions:</strong></p>
            <p>1. First disable email confirmation in Supabase</p>
            <p>2. Register a user with the credentials above</p>
            <p>3. Test login and redirect</p>
            <p>4. Check browser console for debug info</p>
          </div>
        </div>
      </div>
    </div>
  )
}
