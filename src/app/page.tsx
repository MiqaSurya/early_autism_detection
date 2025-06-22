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
    <div className="min-h-screen flex">
      {/* Left pink section */}
      <div className="w-1/6 bg-pink-200"></div>
      
      {/* Center blue section */}
      <div className="w-1/6 bg-blue-300"></div>
      
      {/* Main content section */}
      <div className="flex-1 bg-[#fcf9f3] flex flex-col items-center justify-center relative">
        {/* Dotted pattern overlay - right side */}
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'radial-gradient(circle, #f472b6 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>

        {/* Main content */}
        <div className="z-10 w-full max-w-md px-8">
          <h1 className="text-5xl font-black text-center mb-20 tracking-tight">
            WELCOME TO DETECTING EARLY SIGN OF AUTISM
          </h1>
          
          <form onSubmit={handleLogin} className="space-y-8">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-xl font-bold mb-2">ENTER ID :</label>
              <input
                type="email"
                id="email"
                placeholder="ENTER ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-4 px-4 rounded-full bg-pink-400 text-center text-black font-medium placeholder-black/80"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-xl font-bold mb-2">ENTER PASSWORD :</label>
              <input
                type="password"
                id="password"
                placeholder="ENTER PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-4 px-4 rounded-full bg-pink-400 text-center text-black font-medium placeholder-black/80"
              />
            </div>
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-300 hover:bg-blue-400 text-black font-bold py-3 px-12 rounded-full"
              >
                {loading ? 'LOGGING IN...' : 'LOGIN'}
              </button>
            </div>

            <div className="flex justify-center">
              <Link
                href="/auth/signup"
                className="bg-pink-400 hover:bg-pink-500 text-black font-bold py-3 px-12 rounded-full"
              >
                REGISTER
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
