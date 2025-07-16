'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isCurrentUserAdmin, adminLogout } from '@/lib/admin-auth'
import Link from 'next/link'
import { LogOut, Users, BarChart3, Settings, Home, MessageSquare, MapPin, Building2 } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check admin authentication with a small delay to allow session creation
    const checkAdminAuth = () => {
      const adminStatus = isCurrentUserAdmin()
      setIsAdmin(adminStatus)
      setIsLoading(false)

      if (!adminStatus) {
        router.push('/')
      }
    }

    // Add a small delay to allow session creation to complete
    const timer = setTimeout(checkAdminAuth, 100)
    return () => clearTimeout(timer)
  }, [router])

  const handleLogout = () => {
    adminLogout()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // Will redirect in useEffect
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/assessments', label: 'Assessments', icon: MessageSquare },
    { href: '/admin/locations', label: 'Locations', icon: MapPin },
    { href: '/admin/center-users', label: 'Center Users', icon: Building2 },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  🛡️ Admin Panel
                </h1>
              </div>
              <div className="ml-4 text-sm text-gray-500">
                Early Autism Detector
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, Admin
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Admin Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  >
                    <Icon className="h-5 w-5 mr-3 text-gray-400" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
