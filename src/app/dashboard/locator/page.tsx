import GeoapifyLocationFinder from '@/components/locator/GeoapifyLocationFinder'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LocatorPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        {/* Back to Dashboard Button */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-4">Treatment Center Locator</h1>
        <p className="text-neutral-600">
          Find nearby autism diagnostic centers, therapists, support groups, and
          educational resources in your area.
        </p>
      </div>

      <GeoapifyLocationFinder />
    </div>
  )
}
