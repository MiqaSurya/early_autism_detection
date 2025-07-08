'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Check for admin credentials
      if (email.toLowerCase().trim() === 'admin' && password === 'admin') {
        // Create admin session
        const adminSession = {
          isAdmin: true,
          email: 'admin',
          loginTime: Date.now()
        }

        localStorage.setItem('admin_session', JSON.stringify(adminSession))

        // Redirect to admin dashboard
        window.location.href = '/admin'
        return
      }

      // Regular user login with Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Redirect to dashboard on success
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 px-4 relative overflow-hidden">
      {/* Autism Awareness Ribbon Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full"></div>
        <div className="absolute top-32 right-20 w-24 h-24 bg-red-400 rounded-full"></div>
        <div className="absolute bottom-40 left-32 w-28 h-28 bg-yellow-400 rounded-full"></div>
        <div className="absolute bottom-20 right-40 w-20 h-20 bg-green-400 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-purple-400 rounded-full"></div>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
            {/* Logo and Header */}
            <div className="text-center mb-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-blue-600 mb-2">Early Autism Detector</h1>
                <p className="text-gray-600">Caring for Your Child's Development</p>
              </div>

              {/* Autism Awareness Color Dots */}
              <div className="flex justify-center items-center gap-2 mb-6">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-600 ml-2">Supporting Every Child's Journey</span>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome</h2>
              <p className="text-gray-600">Sign in to access your dashboard</p>
            </div>
          
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                onClick={(e) => {
                  // Backup handling in case form submission doesn't work
                  setTimeout(() => {
                    if (!loading) {
                      handleLogin(e as any)
                    }
                  }, 100)
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 transform hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>


            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200 hover:underline">
                  Sign up
                </Link>
              </p>

              {/* Additional autism awareness message */}
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-600 leading-relaxed">
                  🧩 Early detection makes a difference. Join our community supporting autism awareness and child development.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
