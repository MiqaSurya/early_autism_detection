'use client'

import React from 'react'
import Link from 'next/link'
import { LogoIcon } from '@/components/ui/logo'
import { CheckCircle, Mail, Clock, ArrowRight } from 'lucide-react'

export default function CenterRegistrationSuccessPage() {
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
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
            <p className="text-gray-600">Your autism center has been registered successfully.</p>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <Mail className="h-6 w-6 text-green-600 mt-0.5" />
              <div className="text-left">
                <h3 className="font-semibold text-green-800 mb-1">Email Verification Sent</h3>
                <p className="text-green-700 text-sm">
                  We've sent a verification email to your registered email address. Please check your inbox and click the verification link to activate your account.
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <Clock className="h-6 w-6 text-blue-600 mt-0.5" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-800 mb-1">Admin Verification Required</h3>
                <p className="text-blue-700 text-sm">
                  After email verification, your center registration will be reviewed by our admin team. You'll receive a notification once your center is approved and ready to use.
                </p>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="text-left mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">What happens next?</h3>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">1</span>
                Verify your email address
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">2</span>
                Admin reviews your center registration
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">3</span>
                Receive approval notification
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold mr-3 mt-0.5">4</span>
                Access your center dashboard
              </li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/center-portal/login"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium inline-flex items-center justify-center"
            >
              Go to Center Login
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
            
            <Link
              href="/"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors font-medium inline-flex items-center justify-center"
            >
              Back to Home
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
