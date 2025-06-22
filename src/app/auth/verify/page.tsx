'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function VerifyForm() {
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    async function verifyEmail() {
      try {
        if (!token) {
          setError('Verification token is missing')
          setVerifying(false)
          return
        }

        // Update user's email_confirmed status
        const { error: updateError } = await supabase
          .from('users')
          .update({ email_confirmed: true })
          .eq('id', token)

        if (updateError) throw updateError

        // Redirect to login after successful verification
        setTimeout(() => {
          router.push('/auth/login?verified=true')
        }, 3000)
      } catch (err) {
        console.error('Verification error:', err)
        setError('Failed to verify email address')
        setVerifying(false)
      }
    }

    verifyEmail()
  }, [token, router])

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
          <div className="w-full max-w-md text-center">
            <h1 className="text-5xl font-bold text-black mb-12">
              {verifying ? 'VERIFYING EMAIL' : error ? 'VERIFICATION FAILED' : 'EMAIL VERIFIED'}
            </h1>
            
            {verifying ? (
              <div className="animate-pulse bg-blue-100 border border-blue-400 text-blue-700 px-6 py-4 rounded-lg">
                <p>Verifying your email address...</p>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
                <p>{error}</p>
              </div>
            ) : (
              <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg">
                <p className="text-lg mb-4">Your email has been verified!</p>
                <p>You will be redirected to the login page shortly.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyForm />
    </Suspense>
  )
}
