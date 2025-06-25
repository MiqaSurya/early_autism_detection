'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import ChatInterface from '@/components/chat/chat-interface'

export default function ChatPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/auth/login')
          return
        }

        setUser(session.user)
      } catch (error) {
        console.error('Error checking auth:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 flex items-center justify-center relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-24 h-24 bg-blue-500 rounded-full"></div>
          <div className="absolute top-40 right-32 w-16 h-16 bg-red-500 rounded-full"></div>
          <div className="absolute bottom-40 left-40 w-20 h-20 bg-yellow-500 rounded-full"></div>
          <div className="absolute bottom-32 right-20 w-12 h-12 bg-green-500 rounded-full"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/30">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <p className="text-xl text-gray-700 font-medium">Loading AI Assistant...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 relative overflow-hidden">
      {/* Autism Awareness Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-24 h-24 bg-blue-500 rounded-full"></div>
        <div className="absolute top-40 right-32 w-16 h-16 bg-red-500 rounded-full"></div>
        <div className="absolute bottom-40 left-40 w-20 h-20 bg-yellow-500 rounded-full"></div>
        <div className="absolute bottom-32 right-20 w-12 h-12 bg-green-500 rounded-full"></div>
      </div>

      <div className="relative z-10 h-screen flex flex-col">
        <ChatInterface />
      </div>
    </div>
  )
}
