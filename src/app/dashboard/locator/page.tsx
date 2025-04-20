import { LocationFinder } from '@/components/locator/location-finder'

export default function LocatorPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Treatment Center Locator</h1>
        <p className="text-neutral-600">
          Find nearby autism diagnostic centers, therapists, support groups, and
          educational resources in your area.
        </p>
      </div>

      <LocationFinder />
    </div>
  )
}
