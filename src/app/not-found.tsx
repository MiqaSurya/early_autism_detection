import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="h-16 w-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">?</span>
          </div>
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            404
          </h1>
          <h2 className="text-xl font-semibold text-blue-800 mb-2">
            Page Not Found
          </h2>
          <p className="text-blue-700 mb-4">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/dashboard" className="block">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              🏠 Go to Dashboard
            </button>
          </Link>

          <Link href="/" className="block">
            <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300">
              ← Go Home
            </button>
          </Link>
        </div>

      </div>
    </div>
  )
}
