'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for redirects with status messages
  useEffect(() => {
    // Registration completed
    const fromRegister = searchParams.get('registered')
    if (fromRegister === 'true') {
      setSuccessMessage('Registration successful! Please check your email for a verification link.')
    }
    
    // Email verified
    const verified = searchParams.get('verified')
    if (verified === 'true') {
      setSuccessMessage('Email verified successfully! You can now log in.')
    }
    
    // Verification errors
    const verificationError = searchParams.get('error')
    if (verificationError === 'invalid_token') {
      setError('Invalid verification link. Please try again or request a new verification email.')
    } else if (verificationError === 'verification_failed') {
      setError('Email verification failed. Please contact support or try again.')
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'same-origin'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left pink sidebar */}
      <div className="w-1/6 bg-pink-200"></div>
      
      {/* Middle blue sidebar */}
      <div className="w-1/12 bg-blue-300"></div>
      
      {/* Content area with gradient */}
      <div className="flex-1 bg-gradient-to-br from-neutral-100 to-neutral-50 relative">
        {/* Dotted pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-12 gap-4 h-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-pink-400"></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8">
          <div className="w-full max-w-md">
            <h1 className="text-5xl font-bold text-black mb-20 text-center">
              WELCOME TO DETECTING EARLY SIGN OF AUTISM
            </h1>
            
            <form onSubmit={handleLogin} className="space-y-12 w-full">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {successMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {successMessage}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-xl font-medium mb-2">
                  ENTER ID :
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 bg-pink-400 text-white placeholder-white/80 rounded-full focus:outline-none text-center"
                  placeholder="ENTER ID"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xl font-medium mb-2">
                  ENTER PASSWORD :
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 bg-pink-400 text-white placeholder-white/80 rounded-full focus:outline-none text-center"
                  placeholder="ENTER PASSWORD"
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-300 hover:bg-blue-400 text-black font-medium py-3 px-14 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
                >
                  {loading ? 'SIGNING IN...' : 'LOGIN'}
                </button>
              </div>
              
              <div className="text-center">
                <p>
                  Don't have an account?{' '}
                  <Link href="/auth/register" className="text-blue-600 hover:underline">
                    Register
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
