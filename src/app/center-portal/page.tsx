import Link from 'next/link'
import { Building2, UserPlus, LogIn, Shield, CheckCircle, Users } from 'lucide-react'

export default function CenterPortalPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Autism Center Portal
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Manage your autism center's information and connect with families in need. 
          Join our network of verified autism support centers.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <Shield className="h-8 w-8 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Verified Centers</h3>
          </div>
          <p className="text-gray-600">
            All centers go through our verification process to ensure quality and authenticity.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Connect with Families</h3>
          </div>
          <p className="text-gray-600">
            Help families find your services through our autism center locator.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center mb-4">
            <CheckCircle className="h-8 w-8 text-purple-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Easy Management</h3>
          </div>
          <p className="text-gray-600">
            Update your center information, hours, and services with our simple interface.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Started</h2>
          <p className="text-gray-600">
            Already have an account? Sign in to manage your center. 
            New to our platform? Register your center today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/center-portal/login"
            className="inline-flex items-center justify-center px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Sign In to Your Center
          </Link>

          <Link
            href="/center-portal/register"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            Register Your Center
          </Link>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-12 text-center">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Questions about registration?
          </h3>
          <p className="text-blue-700 mb-4">
            Our verification process typically takes 1-2 business days. 
            You'll receive an email confirmation once your center is approved.
          </p>
          <Link
            href="/contact"
            className="text-blue-600 hover:text-blue-800 font-medium underline"
          >
            Contact our support team
          </Link>
        </div>
      </div>
    </div>
  )
}
