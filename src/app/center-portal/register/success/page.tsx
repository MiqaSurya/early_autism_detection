'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Building2, Mail, Phone } from 'lucide-react'
import { LogoIcon } from '@/components/ui/logo'

export default function CenterRegistrationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-4">
            <LogoIcon className="h-12 w-12" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Registration Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Your autism center has been successfully registered with our platform.
          </p>

          {/* Autism Awareness Colors */}
          <div className="flex justify-center items-center mb-6 text-xs text-blue-600">
            <span className="w-2 h-2 bg-red-400 rounded-full mr-1"></span>
            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
            <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
            <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
            <span>Welcome to Our Network</span>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-800 text-sm mb-3">What's Next?</h3>
            <ul className="space-y-2 text-blue-700 text-xs">
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span>Your center profile is now active and visible to families</span>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span>You can log in to manage your center information</span>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <span>Families can now find and contact your center</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/center-portal/login"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium inline-flex items-center justify-center"
            >
              <Building2 className="h-5 w-5 mr-2" />
              Access Center Portal
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>

            <Link
              href="/dashboard/locator"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium inline-flex items-center justify-center"
            >
              View Center Directory
            </Link>
          </div>

          {/* Contact Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm mb-3">Need help getting started?</p>
            <div className="flex justify-center space-x-4 text-xs">
              <a
                href="mailto:support@autismdetector.com"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <Mail className="h-3 w-3 mr-1" />
                Email Support
              </a>
              <a
                href="tel:+1234567890"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <Phone className="h-3 w-3 mr-1" />
                Call Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
