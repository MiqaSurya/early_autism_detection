'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ScoringRange } from '@/types/questions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  MapPin,
  Navigation,
  ExternalLink
} from 'lucide-react'

type RiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk'

interface ResultsViewProps {
  score: number // Score is already a percentage (0-100)
  interpretation: string
  riskLevel: RiskLevel
  onClose?: () => void
}

export function ResultsView({ 
  score,
  interpretation,
  riskLevel,
  onClose 
}: ResultsViewProps) {
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">
            M-CHAT-R™ Assessment Results
          </h1>
          <p className="text-lg text-neutral-600">
            Modified Checklist for Autism in Toddlers - Revised
          </p>
        </div>

        {/* Results Card */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border-2 border-gray-100">
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold mb-4 text-neutral-800">{score}/20</div>
              <p className={`inline-block px-6 py-3 rounded-full text-lg font-semibold mb-4 ${
                {
                  'Low Risk': 'bg-green-100 text-green-800 border-2 border-green-200',
                  'Medium Risk': 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200',
                  'High Risk': 'bg-red-100 text-red-800 border-2 border-red-200'
                }[riskLevel]
              }`}>
                {riskLevel}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-2">Recommended Action:</h3>
              <p className="text-blue-700 text-lg">
                {interpretation}
              </p>
            </div>

            {/* High Risk - Show Locator Link */}
            {riskLevel === 'High Risk' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <MapPin className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 mb-2">Find Autism Centers Near You</h3>
                    <p className="text-red-700 mb-4">
                      Based on your results, we recommend finding a qualified autism evaluation center in your area for immediate assessment and early intervention services.
                    </p>
                    <Link
                      href="/dashboard/locator"
                      className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                      <Navigation className="h-4 w-4" />
                      Find Centers Near Me
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Medium Risk - Show Locator Link */}
            {riskLevel === 'Medium Risk' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <MapPin className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-800 mb-2">Consider Professional Consultation</h3>
                    <p className="text-yellow-700 mb-4">
                      You may want to locate autism specialists in your area for the M-CHAT-R Follow-Up interview and further evaluation if needed.
                    </p>
                    <Link
                      href="/dashboard/locator"
                      className="inline-flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
                    >
                      <Navigation className="h-4 w-4" />
                      Find Centers Near Me
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t pt-6 mt-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 text-center">
                  <strong>Important:</strong> This M-CHAT-R assessment is a screening tool and not a diagnosis.
                  Please consult with healthcare professionals for a comprehensive evaluation.
                </p>
              </div>

              <button
                onClick={() => {
                  if (onClose) onClose();
                  router.push('/dashboard');
                }}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors text-lg font-semibold"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
