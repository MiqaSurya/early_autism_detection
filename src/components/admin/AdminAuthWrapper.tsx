'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import { Shield, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface AdminAuthWrapperProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export default function AdminAuthWrapper({ children, requireAuth = true }: AdminAuthWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAdminAuth()
  }, [])

  const checkAdminAuth = () => {
    try {
      const adminSession = getAdminSession()
      const isAuth = !!adminSession
      
      setIsAuthenticated(isAuth)
      
      if (requireAuth && !isAuth) {
        // Don't redirect automatically, just show the auth required message
        console.log('Admin authentication required')
      }
    } catch (error) {
      console.error('Error checking admin auth:', error)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h1>
            <p className="text-gray-600">
              You need to be logged in as an administrator to access this page.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/auth/login"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-block"
            >
              Login as Admin
            </Link>
            
            <Link
              href="/admin"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium inline-block"
            >
              Back to Admin Dashboard
            </Link>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Admin Login Instructions:</p>
                <p>Use email: <code className="bg-blue-100 px-1 rounded">admin</code></p>
                <p>Use password: <code className="bg-blue-100 px-1 rounded">admin</code></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Hook to get admin authentication status
export function useAdminAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const adminSession = getAdminSession()
        setIsAuthenticated(!!adminSession)
      } catch (error) {
        console.error('Error checking admin auth:', error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
    
    // Check auth status every minute
    const interval = setInterval(checkAuth, 60000)
    
    return () => clearInterval(interval)
  }, [])

  return { isAuthenticated, loading }
}
