'use client'

import React from 'react'
import Link from 'next/link'
import { LogoIcon } from '@/components/ui/logo'
import { AlertTriangle, ArrowLeft, Building2 } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100 text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-center mb-4">
              <LogoIcon className="h-16 w-16" />
            </div>
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access the center portal.</p>
          </div>

          {/* Error Message */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="text-left">
              <h3 className="font-semibold text-red-800 mb-2">Center Portal Access Required</h3>
              <p className="text-red-700 text-sm">
                This area is restricted to registered autism centers only. If you're an autism center, please register or contact support for assistance.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/center-portal/register"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium inline-flex items-center justify-center"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Register Your Center
            </Link>
            
            <Link
              href="/center-portal/login"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors font-medium inline-flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Center Login
            </Link>

            <Link
              href="/"
              className="w-full bg-gray-50 text-gray-600 py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors font-medium inline-flex items-center justify-center"
            >
              Go to Main Site
            </Link>
          </div>

          {/* Support */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@autismdetector.com" className="text-blue-600 hover:text-blue-800">
                support@autismdetector.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
