'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Automatically redirect to auth/login when users first visit the app
    // Updated: July 2025 - Enhanced with role-based authentication
    // DEPLOYMENT TRIGGER: Force Vercel to deploy latest changes - 2025-07-16
    router.replace('/auth/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to login... (v2025.07.16)</p>
      </div>
    </div>
  )
}
