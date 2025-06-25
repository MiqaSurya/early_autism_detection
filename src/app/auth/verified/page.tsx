'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function VerifiedPage() {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('Verifying your email...')
  const router = useRouter()

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        console.log('🔍 Checking email verification status...')
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setMessage('Verification failed. Please try again.')
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }

        if (session && session.user) {
          console.log('✅ User session found:', session.user.email)
          console.log('Email confirmed:', session.user.email_confirmed_at)
          
          // Check if email is confirmed
          if (session.user.email_confirmed_at) {
            console.log('🎉 Email verified successfully!')
            
            // Create/update user profile with correct data
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                display_name: session.user.user_metadata?.display_name ||
                             session.user.user_metadata?.full_name ||
                             session.user.email?.split('@')[0] || 'User',
                full_name: session.user.user_metadata?.full_name ||
                          session.user.user_metadata?.display_name ||
                          session.user.email?.split('@')[0] || 'User',
                email: session.user.email,
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              })

            if (profileError) {
              console.error('Profile creation error:', profileError)
              // Continue anyway - profile creation failure shouldn't block access
            } else {
              console.log('✅ Profile created/updated successfully')
            }

            setMessage('Email verified successfully! Redirecting to dashboard...')
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              console.log('🚀 Redirecting to dashboard...')
              router.push('/dashboard')
            }, 2000)
            
          } else {
            console.log('❌ Email not confirmed yet')
            setMessage('Email verification pending. Please check your inbox and click the verification link.')
            setTimeout(() => router.push('/auth/login'), 5000)
          }
        } else {
          console.log('❌ No session found')
          setMessage('No active session. Redirecting to login...')
          setTimeout(() => router.push('/auth/login'), 3000)
        }
      } catch (error) {
        console.error('Verification error:', error)
        setMessage('Verification failed. Redirecting to login...')
        setTimeout(() => router.push('/auth/login'), 3000)
      } finally {
        setLoading(false)
      }
    }

    handleEmailVerification()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 relative overflow-hidden">
      {/* Autism Awareness Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500 rounded-full"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-red-500 rounded-full"></div>
        <div className="absolute bottom-40 left-40 w-28 h-28 bg-yellow-500 rounded-full"></div>
        <div className="absolute bottom-32 right-20 w-20 h-20 bg-green-500 rounded-full"></div>
        <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-purple-500 rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/4 w-12 h-12 bg-teal-500 rounded-full"></div>
      </div>

      {/* Floating Puzzle Pieces */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/3 transform rotate-12">
          <svg width="60" height="60" viewBox="0 0 40 40" fill="none">
            <path d="M8 8h6c0-2 2-4 4-4s4 2 4 4h6c2 0 4 2 4 4v6c2 0 4 2 4 4s-2 4-4 4v6c0 2-2 4-4 4h-6c0 2-2 4-4 4s-4-2-4-4H8c-2 0-4-2-4-4v-6c-2 0-4-2-4-4s2-4 4-4V8c0-2 2-4 4-4z" fill="currentColor" className="text-green-400"/>
          </svg>
        </div>
        <div className="absolute bottom-1/4 right-1/3 transform -rotate-12">
          <svg width="50" height="50" viewBox="0 0 40 40" fill="none">
            <path d="M8 8h6c0-2 2-4 4-4s4 2 4 4h6c2 0 4 2 4 4v6c2 0 4 2 4 4s-2 4-4 4v6c0 2-2 4-4 4h-6c0 2-2 4-4 4s-4-2-4-4H8c-2 0-4-2-4-4v-6c-2 0-4-2-4-4s2-4 4-4V8c0-2 2-4 4-4z" fill="currentColor" className="text-blue-400"/>
          </svg>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8">
        <div className="w-full max-w-lg text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-12">
            Email Verification
          </h1>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-white/30">
            {loading && (
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full"></div>
                </div>
              </div>
            )}

            {!loading && (
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-xl text-gray-700 font-medium">
                {message}
              </p>

              {!loading && (
                <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">You will be redirected automatically...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
