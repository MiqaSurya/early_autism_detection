import { AutismCenter } from '@/types/location'

/**
 * Navigate to the navigation page with destination information
 */
export function navigateToNavigationPage(destination: AutismCenter): string {
  const params = new URLSearchParams({
    name: destination.name,
    address: destination.address,
    latitude: destination.latitude.toString(),
    longitude: destination.longitude.toString(),
    type: destination.type,
  })

  if (destination.phone) {
    params.set('phone', destination.phone)
  }

  if (destination.id) {
    params.set('id', destination.id)
  }

  return `/dashboard/navigation?${params.toString()}`
}

/**
 * Parse destination from URL search params
 */
export function parseDestinationFromParams(searchParams: URLSearchParams): AutismCenter | null {
  const name = searchParams.get('name')
  const address = searchParams.get('address')
  const latitude = searchParams.get('latitude')
  const longitude = searchParams.get('longitude')
  const phone = searchParams.get('phone')
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  if (!name || !address || !latitude || !longitude) {
    return null
  }

  return {
    id: id || `nav-${Date.now()}`, // Generate ID if not provided
    name,
    type: (type as any) || 'diagnostic', // Default to diagnostic if not provided
    address,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    phone: phone || undefined,
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}
