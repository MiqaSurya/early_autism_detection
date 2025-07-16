'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { LogoIcon } from '@/components/ui/logo'
import { isAdminCredentials, createAdminSession } from '@/lib/admin-auth'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loginType, setLoginType] = useState<'user' | 'center' | null>(null)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const registered = searchParams.get('registered')
    if (registered === 'true') {
      setSuccessMessage('Registration successful! You can now log in with your credentials.')
    }
  }, [searchParams])

  const handleRoleSelect = (role: 'user' | 'center') => {
    setLoginType(role)
    setShowLoginForm(true)
    setError('')
    setSuccessMessage('')
  }

  const handleBackToRoleSelection = () => {
    setShowLoginForm(false)
    setLoginType(null)
    setEmail('')
    setPassword('')
    setError('')
    setSuccessMessage('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      // Check if admin credentials
      const isAdmin = isAdminCredentials(email, password)

      if (isAdmin) {
        createAdminSession()
        setTimeout(() => {
          window.location.href = '/admin'
        }, 100)
        return
      }

      if (loginType === 'center') {
        // Center portal login
        const response = await fetch('/api/center-portal/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            password
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Center login failed')
        }

        console.log('Center login successful, redirecting to center dashboard')
        router.push('/center-portal/dashboard')
      } else {
        // Regular user login with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password,
        })

        if (error) throw error

        if (data.user) {
          console.log('User login successful, redirecting to main dashboard')
          router.push('/dashboard')
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full"></div>
        <div className="absolute top-32 right-20 w-24 h-24 bg-red-400 rounded-full"></div>
        <div className="absolute bottom-40 left-32 w-28 h-28 bg-yellow-400 rounded-full"></div>
        <div className="absolute bottom-20 right-40 w-20 h-20 bg-green-400 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-purple-400 rounded-full"></div>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
        <div className="w-full max-w-4xl">
          {!showLoginForm ? (
            // Role Selection Screen
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              <div className="text-center mb-12">
                <LogoIcon className="mx-auto mb-6" />
                <h1 className="text-4xl font-bold text-gray-800 mb-4">Select Your Role</h1>
                <p className="text-gray-600 text-lg">Choose your role to access the appropriate dashboard and features</p>

                <div className="mt-6 flex justify-center items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-600 ml-2">Supporting Every Child's Journey</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                {/* Public User Card */}
                <div
                  onClick={() => handleRoleSelect('user')}
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border-2 border-blue-200 hover:border-blue-400 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 group"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 transition-colors">
                      <span className="text-3xl">🌍</span>
                    </div>
                    <h3 className="text-2xl font-bold text-blue-700 mb-3">Public</h3>
                    <p className="text-blue-600 text-sm leading-relaxed">
                      Access resources and support services for autism awareness and child development
                    </p>
                  </div>
                </div>

                {/* Autism Center Card */}
                <div
                  onClick={() => handleRoleSelect('center')}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border-2 border-purple-200 hover:border-purple-400 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 group"
                >
                  <div className="text-center">
                    <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-600 transition-colors">
                      <span className="text-3xl">🏥</span>
                    </div>
                    <h3 className="text-2xl font-bold text-purple-700 mb-3">Autism Center</h3>
                    <p className="text-purple-600 text-sm leading-relaxed">
                      Manage your center profile, services, and connect with families seeking support
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center">
                <p className="text-gray-500 text-sm">
                  🧩 Early detection makes a difference. Join our community supporting autism awareness and child development.
                </p>
              </div>
            </div>
          ) : (
            // Login Form Screen
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20 max-w-md mx-auto">
              <div className="text-center mb-8">
                <button
                  onClick={handleBackToRoleSelection}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to role selection
                </button>

                <LogoIcon className="mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-blue-600">
                  {loginType === 'center' ? 'Center Login' : 'Welcome Back'}
                </h1>
                <p className="text-gray-600 mt-2">
                  {loginType === 'center'
                    ? 'Sign in to your center dashboard'
                    : 'Sign in to your account'
                  }
                </p>

                <div className="mt-6 flex justify-center items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-600 ml-2">Supporting Every Child's Journey</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-600 text-sm">{successMessage}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="text"
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
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 transform hover:scale-105"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    `Sign In ${loginType === "center" ? "as Center" : "as User"}`
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    href={loginType === 'center' ? '/center-portal/register' : '/auth/register'}
                    className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200 hover:underline"
                  >
                    {loginType === 'center' ? 'Register as Center' : 'Sign up as User'}
                  </Link>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {loginType === 'center'
                    ? 'Register your autism center to manage your profile and services'
                    : 'Create an account to access autism screening tools and resources'
                  }
                </p>
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-600 leading-relaxed">
                  🧩 Early detection makes a difference. Join our community supporting autism awareness and child development.
                </p>
              </div>
            </div>
          )}
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
