'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SimpleLoginPage() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('TestPass123!')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [step, setStep] = useState(1)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setMessage('')
    setStep(1)
    
    try {
      console.log('🔐 Step 1: Attempting login...')
      setMessage('Step 1: Attempting login...')
      setStep(1)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      if (error) {
        console.error('❌ Login failed:', error)
        if (error.message.includes('Invalid login credentials')) {
          setMessage('❌ User not found. Please run the SQL script first to create the test user.')
        } else {
          setMessage(`❌ Login failed: ${error.message}`)
        }
        return
      }

      console.log('✅ Step 1 complete: Login successful!')
      console.log('User:', data.user?.email)
      
      setMessage('✅ Step 1: Login successful! Checking session...')
      setStep(2)
      
      // Step 2: Wait for session to be established
      console.log('🔍 Step 2: Checking session establishment...')
      let attempts = 0
      const maxAttempts = 10
      
      const checkSession = async () => {
        attempts++
        console.log(`🔍 Session check attempt ${attempts}/${maxAttempts}`)
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setMessage(`❌ Session error: ${sessionError.message}`)
          return
        }
        
        if (session && session.user) {
          console.log('✅ Step 2 complete: Session established!')
          console.log('Session user:', session.user.email)
          console.log('Access token present:', !!session.access_token)
          
          setMessage('✅ Step 2: Session established! Redirecting to dashboard...')
          setStep(3)
          
          // Step 3: Redirect to dashboard
          console.log('🚀 Step 3: Redirecting to dashboard...')
          setTimeout(() => {
            router.push('/dashboard')
          }, 1000)
          
        } else if (attempts < maxAttempts) {
          setMessage(`⏳ Step 2: Waiting for session... (${attempts}/${maxAttempts})`)
          setTimeout(checkSession, 500)
        } else {
          console.error('❌ Session never established after', maxAttempts, 'attempts')
          setMessage('❌ Session could not be established. Check browser console for details.')
        }
      }
      
      // Start session check after a brief delay
      setTimeout(checkSession, 200)
      
    } catch (err) {
      console.error('❌ Login process failed:', err)
      setMessage(`❌ Login process failed: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckExistingSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        setMessage(`Session check error: ${error.message}`)
      } else if (session) {
        setMessage(`✅ Active session found for: ${session.user?.email}`)
        console.log('Existing session:', session)
      } else {
        setMessage('❌ No active session found')
      }
    } catch (err) {
      setMessage(`Session check failed: ${err}`)
    }
  }

  const copySQL = () => {
    const sql = `-- Run this in Supabase SQL Editor
DO $$
DECLARE
    user_id UUID;
BEGIN
    user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        user_id, 'authenticated', 'authenticated',
        'test@example.com',
        crypt('TestPass123!', gen_salt('bf')),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"display_name": "Test User", "email": "test@example.com"}',
        NOW(), NOW()
    );
    
    INSERT INTO public.profiles (id, display_name, email, email_verified)
    VALUES (user_id, 'Test User', 'test@example.com', true);
END $$;`

    navigator.clipboard.writeText(sql).then(() => {
      setMessage('✅ SQL copied to clipboard! Paste in Supabase SQL Editor.')
    }).catch(() => {
      console.log('SQL to create user:', sql)
      setMessage('❌ Could not copy. Check console for SQL code.')
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Simple Login Test
        </h1>
        
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Rate Limit Bypass</h3>
          <p className="text-sm text-red-700">
            This page only tests login (no registration) to avoid rate limits.
          </p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="test@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="TestPass123!"
            />
          </div>
          
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Testing Login...' : 'Test Login → Dashboard'}
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={handleCheckExistingSession}
              className="flex-1 bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 text-sm"
            >
              Check Session
            </button>
            
            <button
              onClick={copySQL}
              className="flex-1 bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 text-sm"
            >
              Copy SQL
            </button>
          </div>
          
          {message && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  step === 1 ? 'bg-blue-500' : 
                  step === 2 ? 'bg-yellow-500' : 
                  step === 3 ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
                <span className="text-sm font-mono">{message}</span>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Steps:</strong></p>
            <p>1. Run SQL in Supabase to create test user</p>
            <p>2. Disable email confirmation in Auth settings</p>
            <p>3. Test login with credentials above</p>
            <p>4. Should redirect to dashboard automatically</p>
          </div>
        </div>
      </div>
    </div>
  )
}
