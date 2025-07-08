import { Search, Home, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <Search className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            404
          </h1>
          <h2 className="text-xl font-semibold text-blue-800 mb-2">
            Page Not Found
          </h2>
          <p className="text-blue-700 mb-4">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/dashboard" className="block">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </button>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">
            Looking for something specific?
          </p>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
              • Dashboard
            </Link>
            <Link href="/dashboard/assessment" className="text-blue-600 hover:text-blue-800">
              • M-CHAT-R Assessment
            </Link>
            <Link href="/dashboard/locator" className="text-blue-600 hover:text-blue-800">
              • Autism Center Locator
            </Link>
            <Link href="/dashboard/chat" className="text-blue-600 hover:text-blue-800">
              • AI Chat Support
            </Link>
            <Link href="/dashboard/progress" className="text-blue-600 hover:text-blue-800">
              • Progress Tracking
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
