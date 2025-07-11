import Link from 'next/link'
import { CheckCircle, Clock, Mail, Shield } from 'lucide-react'

export default function RegistrationSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Success Icon */}
      <div className="flex justify-center mb-6">
        <div className="bg-green-100 p-4 rounded-full">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
      </div>

      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Registration Submitted Successfully!
      </h1>
      <p className="text-xl text-gray-600 mb-8">
        Thank you for registering your autism center with our platform.
      </p>

      {/* Status Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Under Review
          </h3>
          <p className="text-blue-700">
            Your center registration is currently being reviewed by our admin team. 
            This process typically takes 1-2 business days.
          </p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            Email Confirmation
          </h3>
          <p className="text-purple-700">
            You'll receive an email confirmation once your center has been verified 
            and approved for listing.
          </p>
        </div>
      </div>

      {/* What's Next Section */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">What happens next?</h2>
        
        <div className="space-y-4 text-left">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-full mr-4 mt-1">
              <Shield className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Verification Process</h4>
              <p className="text-gray-600">
                Our team will verify your center information, business license, and credentials.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-green-100 p-2 rounded-full mr-4 mt-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Approval & Activation</h4>
              <p className="text-gray-600">
                Once approved, your center will be listed in our autism center locator and you'll gain access to the management dashboard.
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="bg-purple-100 p-2 rounded-full mr-4 mt-1">
              <Mail className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Email Notification</h4>
              <p className="text-gray-600">
                You'll receive detailed instructions on how to access and manage your center profile.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
        <Link
          href="/center-portal/login"
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Signing In
        </Link>
        
        <Link
          href="/center-portal"
          className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Portal Home
        </Link>
      </div>

      {/* Contact Info */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Questions or Need Help?
        </h3>
        <p className="text-gray-600 mb-4">
          If you have any questions about the registration process or need assistance, 
          please don't hesitate to contact our support team.
        </p>
        <Link
          href="/contact"
          className="text-blue-600 hover:text-blue-800 font-medium underline"
        >
          Contact Support Team
        </Link>
      </div>
    </div>
  )
}
