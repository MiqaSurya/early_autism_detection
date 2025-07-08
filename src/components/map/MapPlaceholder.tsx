'use client'

import React from 'react'
import { MapPin } from 'lucide-react'

// Temporary placeholder for GeoapifyMap component
// This will be properly implemented after production deployment

interface GeoapifyMapProps {
  centers?: any[]
  userLocation?: [number, number]
  selectedLocation?: any
  onCenterSelect?: (center: any) => void
  route?: any
  showRoute?: boolean
  className?: string
  zoom?: number
  center?: [number, number]
  [key: string]: any // Allow any additional props
}

export default function GeoapifyMap(props: GeoapifyMapProps) {
  return (
    <div className={`bg-gray-100 rounded-lg flex items-center justify-center min-h-[400px] ${props.className || ''}`}>
      <div className="text-center p-8">
        <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          Map Component
        </h3>
        <p className="text-gray-500 text-sm">
          Interactive map will be available after production deployment.
          <br />
          This placeholder ensures the application builds successfully.
        </p>
        {props.centers && (
          <p className="text-xs text-gray-400 mt-4">
            {props.centers.length} centers available
          </p>
        )}
      </div>
    </div>
  )
}
