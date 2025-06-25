'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function BypassRateLimitPage() {
  const [email, setEmail] = useState('testuser@example.com')
  const [password, setPassword] = useState('TestPass123!')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleDirectLogin = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      console.log('🔐 Attempting direct login (bypassing registration)...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Login error:', error)
        setMessage(`Login failed: ${error.message}`)
        
        if (error.message.includes('Invalid login credentials')) {
          setMessage('User does not exist. Try the "Create User via SQL" option below.')
        }
        return
      }

      console.log('✅ Login successful!')
      console.log('User data:', data.user)
      
      setMessage('Login successful! Checking session...')
      
      // Check session establishment
      let attempts = 0
      const checkSession = async () => {
        attempts++
        console.log(`🔍 Checking session... Attempt ${attempts}`)
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (session && session.user) {
          console.log('✅ Session established!')
          setMessage(`Session established! Redirecting to dashboard...`)
          
          setTimeout(() => {
            console.log('🚀 Redirecting to dashboard...')
            router.push('/dashboard')
          }, 1000)
          
        } else if (attempts < 10) {
          console.log('⏳ Session not ready, retrying...')
          setTimeout(checkSession, 500)
        } else {
          console.error('❌ Session never established')
          setMessage('Session could not be established. Check console for details.')
        }
      }
      
      setTimeout(checkSession, 100)
      
    } catch (err) {
      console.error('❌ Login failed:', err)
      setMessage(`Login failed: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUserSQL = () => {
    const sqlCode = `
-- Run this in Supabase SQL Editor to create a test user
-- This bypasses the email rate limit

-- 1. First, disable email confirmations temporarily
-- Go to Auth → Settings → Turn OFF "Enable email confirmations"

-- 2. Then run this SQL to create a user directly:
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  '${email}',
  crypt('${password}', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "Test User", "full_name": "Test User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 3. Create profile for the user
INSERT INTO public.profiles (id, display_name, email, email_verified)
SELECT 
  id,
  'Test User',
  email,
  true
FROM auth.users 
WHERE email = '${email}';
`;

    navigator.clipboard.writeText(sqlCode).then(() => {
      setMessage('SQL code copied to clipboard! Paste it in Supabase SQL Editor.')
    }).catch(() => {
      setMessage('Could not copy to clipboard. Check console for SQL code.')
      console.log('SQL Code to create user:', sqlCode)
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center text-red-600">
          Rate Limit Bypass
        </h1>
        
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Rate Limit Hit:</strong> Supabase is blocking new registrations. 
            Use the options below to test login functionality.
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleDirectLogin}
            disabled={loading}
            className="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing Login...' : 'Test Login (Existing User)'}
          </button>
          
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">
              If user doesn't exist, create one via SQL:
            </p>
            <button
              onClick={handleCreateUserSQL}
              className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              Copy SQL to Create User
            </button>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">Quick fixes:</p>
            <div className="space-y-2 text-xs">
              <p>• <strong>Disable email confirmation:</strong> Supabase Dashboard → Auth → Settings</p>
              <p>• <strong>Wait 1 hour:</strong> Rate limit will reset</p>
              <p>• <strong>Use existing user:</strong> Try login with known credentials</p>
            </div>
          </div>
          
          {message && (
            <div className="p-3 bg-gray-100 rounded text-sm">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
