'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

export function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)
  const router = useRouter()
  const { toast } = useToast()



  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setLoading(true)
      
      // Basic validations
      if (!email || !password) {
        setError('Please fill in all fields')
        setLoading(false)
        return
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }
      
      console.log('Starting signup process...')
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      console.log('Signup response:', {
        success: !error,
        hasUser: !!data?.user,
        errorType: error?.name
      })
      
      if (error) {
        if (error.message.includes('network')) {
          throw new Error('Unable to connect to the authentication service. Please check your internet connection.')
        }
        if (error.message.includes('User already registered')) {
          throw new Error('This email is already registered. Please try logging in instead.')
        }
        throw error
      }
      
      if (!data.user) {
        throw new Error('Registration failed - no user data received')
      }
      
      setVerificationSent(true)
      toast({
        title: 'Registration successful!',
        description: 'Please check your email for the verification link.'
      })
    } catch (err) {
      console.error('Registration error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  if (verificationSent) {
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
              <h1 className="text-5xl font-bold text-black mb-12 text-center">
                EMAIL VERIFICATION SENT
              </h1>
              
              <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-8">
                <p className="text-lg mb-4">Please check your email for a verification link.</p>
                <p>You'll need to verify your email before you can log in.</p>
              </div>
              
              <p className="text-neutral-600 mb-6">
                You will be redirected to the login page shortly.
              </p>
              
              <Link href="/auth/login" className="bg-blue-300 hover:bg-blue-400 text-black font-medium py-3 px-14 rounded-full">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSignup} className="space-y-6 w-full max-w-md mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-xl font-medium mb-2">
          ENTER EMAIL :
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 bg-pink-400 text-white placeholder-white/80 rounded-full focus:outline-none text-center"
          placeholder="ENTER EMAIL"
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

      <div>
        <label htmlFor="confirmPassword" className="block text-xl font-medium mb-2">
          CONFIRM PASSWORD :
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full p-3 bg-pink-400 text-white placeholder-white/80 rounded-full focus:outline-none text-center"
          placeholder="CONFIRM PASSWORD"
        />
      </div>

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-300 hover:bg-blue-400 text-black font-medium py-3 px-14 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
        >
          {loading ? 'REGISTERING...' : 'REGISTER'}
        </button>
      </div>
      
      <div className="text-center">
        <p>
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </form>
  )
}
