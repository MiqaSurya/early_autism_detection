'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogoIcon } from '@/components/ui/logo'
import { Mail, CheckCircle, Clock, RefreshCw, ArrowLeft } from 'lucide-react'

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Get user email from session if available
    const getUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setUserEmail(session.user.email)
      }
    }
    getUserEmail()
  }, [])

  const handleResendVerification = async () => {
    if (!userEmail) {
      setError('No email address found. Please try registering again.')
      return
    }

    setLoading(true)
    setError('')
    setResendSuccess(false)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      setResendSuccess(true)
    } catch (err) {
      console.error('Resend verification error:', err)
      setError(err instanceof Error ? err.message : 'Failed to resend verification email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <LogoIcon className="mx-auto mb-4" />
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-blue-600 mb-2">Check Your Email</h1>
              <p className="text-gray-600">
                We&apos;ve sent a verification link to your email address
              </p>
              {userEmail && (
                <p className="text-sm text-blue-600 font-medium mt-2">{userEmail}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-green-600 text-sm">Verification email sent successfully!</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                What&apos;s Next?
              </h2>
              <ol className="space-y-3 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                  <span>Open your email inbox and look for our verification email</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                  <span>Click the &quot;Verify Email&quot; button in the email</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                  <span>You&apos;ll be redirected back to login automatically</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                  <span>Sign in with your email and password to access your dashboard</span>
                </li>
              </ol>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <RefreshCw className="h-5 w-5" />
                    <span>Resend Verification Email</span>
                  </div>
                )}
              </button>

              <Link
                href="/auth/login"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Login</span>
              </Link>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Didn&apos;t receive the email? Check your spam folder or try resending.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
