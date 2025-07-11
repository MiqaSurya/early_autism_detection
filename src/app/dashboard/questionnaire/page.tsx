'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { QuestionnaireForm } from '@/components/questionnaire/questionnaire-form'
import { User, ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

type Child = {
  id: string
  name: string
  date_of_birth: string
  gender?: string
}

export default function QuestionnairePage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchChildren()
  }, [])

  const fetchChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('id, name, date_of_birth, gender')
        .order('created_at', { ascending: false })

      if (error) throw error

      setChildren(data || [])

      // If there's only one child, auto-select them
      if (data && data.length === 1) {
        setSelectedChildId(data[0].id)
      }
    } catch (err) {
      console.error('Error fetching children:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birth = new Date(dateOfBirth)
    const ageInMonths = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44))

    if (ageInMonths < 12) {
      return `${ageInMonths} months`
    } else {
      const years = Math.floor(ageInMonths / 12)
      const months = ageInMonths % 12
      return months > 0 ? `${years}y ${months}m` : `${years} years`
    }
  }

  const selectedChild = children.find(child => child.id === selectedChildId)

  if (showQuestionnaire && selectedChildId) {
    return (
      <div className="min-h-screen bg-neutral-50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="relative">
          <QuestionnaireForm childId={selectedChildId} />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">M-CHAT-R™ Assessment</h1>
            <p className="text-gray-600">Modified Checklist for Autism in Toddlers - Revised</p>
          </div>
        </div>

        {/* Child Selection */}
        {children.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Child Profiles Found</h2>
            <p className="text-gray-600 mb-6">
              You need to create a child profile before taking an assessment.
            </p>
            <Link
              href="/dashboard/add-child"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Child Profile
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Child for Assessment</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {children.map((child) => (
                <div
                  key={child.id}
                  className={`border rounded-lg p-6 cursor-pointer transition-all ${
                    selectedChildId === child.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedChildId(child.id)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{child.name}</h3>
                      <p className="text-sm text-gray-600">{calculateAge(child.date_of_birth)}</p>
                    </div>
                  </div>

                  {selectedChildId === child.id && (
                    <div className="text-center">
                      <span className="inline-block px-3 py-1 bg-blue-600 text-white text-sm rounded-full">
                        Selected
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedChild && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">Assessment for {selectedChild.name}</h3>
                <p className="text-blue-700 text-sm">
                  This M-CHAT-R assessment will be saved to {selectedChild.name}'s profile.
                  You can view the results and track progress in the Progress section.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href="/dashboard/add-child"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Add Another Child
              </Link>

              <button
                onClick={() => setShowQuestionnaire(true)}
                disabled={!selectedChildId}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Start Assessment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
