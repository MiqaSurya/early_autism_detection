'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Volume2, VolumeX, Navigation, Phone, MapPin } from 'lucide-react'
import { NavigationRoute, RouteStep, getManeuverIcon, formatDistance, formatDuration, getEstimatedArrival, getCurrentStep, getVoiceInstruction } from '@/lib/navigation'
import SSRSafeNavigationMap from './SSRSafeNavigationMap'

interface TurnByTurnNavigationProps {
  route: NavigationRoute
  userLocation: [number, number]
  destination: {
    name: string
    address: string
    phone?: string
    latitude: number
    longitude: number
  }
  onClose: () => void
  onRecalculate?: () => void
  onLocationUpdate?: (location: [number, number]) => void
}

export default function TurnByTurnNavigation({
  route,
  userLocation,
  destination,
  onClose,
  onRecalculate,
  onLocationUpdate
}: TurnByTurnNavigationProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [hasSpoken, setHasSpoken] = useState(false)

  // Get current step based on user location
  useEffect(() => {
    const { stepIndex } = getCurrentStep({ lat: userLocation[0], lon: userLocation[1] }, route)
    if (stepIndex !== currentStepIndex && stepIndex >= 0) {
      setCurrentStepIndex(stepIndex)
      setHasSpoken(false) // Reset speech flag for new step
    }
  }, [userLocation, route, currentStepIndex])

  // Voice navigation
  useEffect(() => {
    if (voiceEnabled && !hasSpoken && route.steps[currentStepIndex]) {
      const step = route.steps[currentStepIndex]
      const instruction = getVoiceInstruction(step)
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(instruction)
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.volume = 0.8
        
        speechSynthesis.speak(utterance)
        setHasSpoken(true)
      }
    }
  }, [voiceEnabled, hasSpoken, currentStepIndex, route.steps])

  const currentStep = route.steps[currentStepIndex]
  const nextStep = route.steps[currentStepIndex + 1]
  const remainingDistance = route.steps.slice(currentStepIndex).reduce((sum, step) => sum + step.distance, 0)
  const remainingDuration = route.steps.slice(currentStepIndex).reduce((sum, step) => sum + step.duration, 0)

  const handleVoiceToggle = () => {
    setVoiceEnabled(!voiceEnabled)
    if (!voiceEnabled) {
      // Test voice with current instruction
      if (currentStep && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance("Voice navigation enabled")
        speechSynthesis.speak(utterance)
      }
    }
  }

  const handleCall = () => {
    if (destination.phone) {
      window.open(`tel:${destination.phone}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Navigation className="h-6 w-6" />
          <div>
            <h1 className="font-semibold">{destination.name}</h1>
            <p className="text-blue-100 text-sm">{destination.address}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleVoiceToggle}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-700"
          >
            {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
          
          {destination.phone && (
            <Button
              onClick={handleCall}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700"
            >
              <Phone className="h-5 w-5" />
            </Button>
          )}
          
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Current Instruction */}
      <div className="bg-white border-b p-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl">
            {currentStep ? getManeuverIcon(currentStep.maneuver, currentStep.direction) : '➡️'}
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-1">
              {currentStep?.instruction || 'Continue straight'}
            </h2>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{formatDistance(currentStep?.distance || 0)}</span>
              {currentStep?.street && (
                <span>on {currentStep.street}</span>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-semibold">{formatDistance(remainingDistance)}</div>
            <div className="text-sm text-gray-600">{formatDuration(remainingDuration)}</div>
            <div className="text-xs text-gray-500">
              ETA {getEstimatedArrival(remainingDuration)}
            </div>
          </div>
        </div>
      </div>

      {/* Next Instruction Preview */}
      {nextStep && (
        <div className="bg-gray-50 border-b p-4">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-lg">
              {getManeuverIcon(nextStep.maneuver, nextStep.direction)}
            </span>
            <span className="text-gray-700">
              Then {nextStep.instruction}
            </span>
            <span className="text-gray-500">
              in {formatDistance(nextStep.distance)}
            </span>
          </div>
        </div>
      )}

      {/* Map Area */}
      <div className="flex-1 relative">
        <SSRSafeNavigationMap
          userLocation={userLocation}
          destination={[destination.latitude, destination.longitude]}
          route={route}
          currentStepIndex={currentStepIndex}
          onLocationUpdate={onLocationUpdate}
          className="absolute inset-0"
        />
      </div>

      {/* Bottom Controls */}
      <div className="bg-white border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Step {currentStepIndex + 1} of {route.steps.length}
            </div>
            
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / route.steps.length) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            {onRecalculate && (
              <Button
                onClick={onRecalculate}
                variant="outline"
                size="sm"
              >
                Recalculate
              </Button>
            )}
            
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              Exit Navigation
            </Button>
          </div>
        </div>
      </div>

      {/* Arrival Detection */}
      {currentStepIndex >= route.steps.length - 1 && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Card className="p-8 text-center max-w-sm mx-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-2">You've Arrived!</h2>
            <p className="text-gray-600 mb-4">
              Welcome to {destination.name}
            </p>
            <div className="flex gap-2">
              {destination.phone && (
                <Button onClick={handleCall} className="flex-1">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              )}
              <Button onClick={onClose} variant="outline" className="flex-1">
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
