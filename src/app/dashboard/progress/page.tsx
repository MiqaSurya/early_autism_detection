'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Users, Plus, BarChart3, Calendar, TrendingUp, Target, FileText, Award, AlertTriangle, Trash2, User, Edit } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

type Child = {
  id: string
  name: string
  date_of_birth: string
  gender?: string
}

type Assessment = {
  id: string
  score: number
  risk_level: string
  completed_at: string
  notes?: string
}

type ProgressSummary = {
  totalAssessments: number
  latestScore?: number
  latestRiskLevel?: string
  scoreImprovement?: number
  lastAssessmentDate?: string
}

export default function ProgressPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  const [progressData, setProgressData] = useState<Record<string, ProgressSummary>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { toast } = useToast()

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

      const childrenData = data || []
      setChildren(childrenData)

      if (childrenData.length > 0) {
        setSelectedChildId(childrenData[0].id)
        await fetchProgressData(childrenData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch children')
    } finally {
      setLoading(false)
    }
  }

  const fetchProgressData = async (childrenList: Child[]) => {
    try {
      const progressMap: Record<string, ProgressSummary> = {}

      for (const child of childrenList) {
        const { data: assessments, error } = await supabase
          .from('assessments')
          .select('id, score, risk_level, completed_at, notes')
          .eq('child_id', child.id)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })

        if (error) {
          console.error('Error fetching assessments for child:', child.id, error)
          continue
        }

        const assessmentData = assessments || []
        const totalAssessments = assessmentData.length

        if (totalAssessments > 0) {
          const latest = assessmentData[0]
          const previous = assessmentData[1]

          progressMap[child.id] = {
            totalAssessments,
            latestScore: latest.score,
            latestRiskLevel: latest.risk_level,
            scoreImprovement: previous ? latest.score - previous.score : 0,
            lastAssessmentDate: latest.completed_at
          }
        } else {
          progressMap[child.id] = {
            totalAssessments: 0
          }
        }
      }

      setProgressData(progressMap)
    } catch (err) {
      console.error('Error fetching progress data:', err)
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

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const handleDeleteChild = async () => {
    if (!selectedChildId) return

    setDeleteLoading(true)
    const selectedChild = children.find(c => c.id === selectedChildId)

    try {
      // Step 1: Get all assessments for this child
      const { data: assessments } = await supabase
        .from('assessments')
        .select('id')
        .eq('child_id', selectedChildId)

      const assessmentIds = assessments?.map(a => a.id) || []

      // Step 2: Delete responses first (they reference assessments)
      if (assessmentIds.length > 0) {
        const { error: responsesError } = await supabase
          .from('responses')
          .delete()
          .in('assessment_id', assessmentIds)

        if (responsesError) {
          console.log('Responses deletion error (might not exist):', responsesError)
        }
      }

      // Step 3: Delete assessments (they reference children)
      const { error: assessmentsError } = await supabase
        .from('assessments')
        .delete()
        .eq('child_id', selectedChildId)

      if (assessmentsError) {
        console.error('Failed to delete assessments:', assessmentsError)
        throw new Error(`Cannot delete assessments: ${assessmentsError.message}`)
      }

      // Step 4: Delete other child-related data (ignore errors if tables don't exist)
      const childTables = ['milestones', 'progress_notes', 'interventions', 'assessment_comparisons', 'development_photos']

      for (const tableName of childTables) {
        try {
          await supabase.from(tableName).delete().eq('child_id', selectedChildId)
        } catch (e) {
          console.log(`Table ${tableName} might not exist, skipping`)
        }
      }

      // Step 5: Finally delete the child profile
      const { error: childError } = await supabase
        .from('children')
        .delete()
        .eq('id', selectedChildId)

      if (childError) {
        console.error('Failed to delete child:', childError)
        throw new Error(`Cannot delete child profile: ${childError.message}`)
      }

      toast({
        title: 'Profile Deleted',
        description: `${selectedChild?.name}'s profile has been permanently deleted.`
      })

      // Refresh the children list
      await fetchChildren()
      setShowDeleteConfirm(false)

    } catch (err) {
      console.error('Delete error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete child profile'

      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: errorMessage
      })
    } finally {
      setDeleteLoading(false)
    }
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 px-4 relative overflow-hidden">
        {/* Background decorative autism-themed elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Large heart puzzle - center */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-6">
            <div className="relative w-32 h-26">
              <div className="absolute top-0 left-0 w-16 h-16 bg-pink-300 rounded-full transform rotate-45"></div>
              <div className="absolute top-0 right-0 w-16 h-16 bg-pink-300 rounded-full transform rotate-45"></div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-16 border-r-16 border-t-20 border-l-transparent border-r-transparent border-t-pink-300"></div>
              {/* Puzzle piece overlays */}
              <div className="absolute top-3 left-3 w-6 h-6 bg-white rounded relative">
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
              </div>
              <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded relative">
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rounded relative">
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-pink-300 rounded-full"></div>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Learning blocks - top right */}
          <div className="absolute top-20 right-10 opacity-5 transform -rotate-6">
            <div className="grid grid-cols-2 gap-1">
              <div className="w-5 h-5 bg-red-300 rounded"></div>
              <div className="w-5 h-5 bg-blue-300 rounded"></div>
              <div className="w-5 h-5 bg-green-300 rounded"></div>
              <div className="w-5 h-5 bg-yellow-300 rounded"></div>
            </div>
          </div>

          {/* Therapy materials - bottom left */}
          <div className="absolute bottom-20 left-10 opacity-5 transform rotate-12">
            <div className="flex gap-1">
              <div className="w-4 h-8 bg-purple-300 rounded-t-full"></div>
              <div className="w-4 h-8 bg-cyan-300 rounded-t-full"></div>
              <div className="w-4 h-8 bg-orange-300 rounded-t-full"></div>
            </div>
          </div>

          {/* Floating puzzle pieces */}
          <div className="absolute top-1/4 left-1/4 opacity-3">
            <div className="w-5 h-5 bg-gradient-to-br from-purple-300 to-purple-500 rounded relative">
              <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gradient-to-br from-purple-300 to-purple-500 rounded-full"></div>
              <div className="absolute -right-0.5 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>

          <div className="absolute top-3/4 right-1/4 opacity-3">
            <div className="w-4 h-4 bg-gradient-to-br from-cyan-300 to-cyan-500 rounded relative">
              <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-white rounded-full"></div>
              <div className="absolute -left-0.5 top-1/2 transform -translate-y-1/2 w-0.5 h-0.5 bg-gradient-to-br from-cyan-300 to-cyan-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto py-12 relative z-10">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border border-white/30 text-blue-600 hover:text-blue-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-semibold">Back to Dashboard</span>
            </Link>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center shadow-2xl border border-white/30">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              No Children Added Yet
            </h2>
            <p className="text-xl text-gray-700 mb-8 max-w-md mx-auto leading-relaxed">
              To track progress and view development history, you need to add a child profile first.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard/add-child">
                <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                  <Plus className="h-5 w-5" />
                  Add Child Profile
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="bg-white/60 backdrop-blur-sm border border-gray-300 hover:bg-white/80 text-gray-700 px-8 py-4 rounded-2xl flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                  <ArrowLeft className="h-5 w-5" />
                  Back to Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 px-4 relative overflow-hidden">
      {/* Background decorative autism-themed elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Autism awareness puzzle pieces - top left */}
        <div className="absolute top-20 left-10 opacity-6 transform rotate-12">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg relative">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
            <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full"></div>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
            <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Therapy blocks - top right */}
        <div className="absolute top-32 right-10 opacity-5 transform -rotate-6">
          <div className="grid grid-cols-2 gap-2">
            <div className="w-8 h-8 bg-red-400 rounded"></div>
            <div className="w-8 h-8 bg-blue-400 rounded"></div>
            <div className="w-8 h-8 bg-green-400 rounded"></div>
            <div className="w-8 h-8 bg-yellow-400 rounded"></div>
          </div>
        </div>

        {/* Learning materials - bottom left */}
        <div className="absolute bottom-32 left-20 opacity-6 transform rotate-6">
          <div className="flex gap-2">
            <div className="w-6 h-12 bg-red-400 rounded-t-full"></div>
            <div className="w-6 h-12 bg-blue-400 rounded-t-full"></div>
            <div className="w-6 h-12 bg-green-400 rounded-t-full"></div>
            <div className="w-6 h-12 bg-yellow-400 rounded-t-full"></div>
          </div>
        </div>

        {/* Heart puzzle - bottom right */}
        <div className="absolute bottom-20 right-20 opacity-8 transform -rotate-12">
          <div className="relative w-20 h-16">
            <div className="absolute top-0 left-0 w-10 h-10 bg-pink-400 rounded-full transform rotate-45"></div>
            <div className="absolute top-0 right-0 w-10 h-10 bg-pink-400 rounded-full transform rotate-45"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-10 border-r-10 border-t-12 border-l-transparent border-r-transparent border-t-pink-400"></div>
            {/* Small puzzle pieces overlay */}
            <div className="absolute top-2 left-2 w-3 h-3 bg-white rounded relative">
              <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-white rounded-full"></div>
              <div className="absolute -right-0.5 top-1/2 transform -translate-y-1/2 w-0.5 h-0.5 bg-pink-400 rounded-full"></div>
            </div>
            <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded relative">
              <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-pink-400 rounded-full"></div>
              <div className="absolute -left-0.5 top-1/2 transform -translate-y-1/2 w-0.5 h-0.5 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Additional floating puzzle pieces */}
        <div className="absolute top-1/3 left-1/4 opacity-4">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded relative">
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full"></div>
            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>

        <div className="absolute top-2/3 right-1/3 opacity-4">
          <div className="w-5 h-5 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded relative">
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full"></div>
            <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border border-white/30 text-blue-600 hover:text-blue-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-semibold">Back to Dashboard</span>
          </Link>
        </div>

        {/* Page Title */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/30 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Progress Tracking
              </h1>
              <p className="text-gray-700 text-lg">
                Monitor development milestones and assessment history for your children
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{children.length}</div>
                <div className="text-sm text-gray-600">Children</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Object.values(progressData).reduce((sum, data) => sum + data.totalAssessments, 0)}
                </div>
                <div className="text-sm text-gray-600">Assessments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Child Profile */}
        {selectedChildId && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/30 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {children.find(c => c.id === selectedChildId)?.name}
                  </h2>
                  <div className="flex items-center gap-4 text-gray-600">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Age: {children.find(c => c.id === selectedChildId) && calculateAge(children.find(c => c.id === selectedChildId)!.date_of_birth)}
                    </span>
                    {children.find(c => c.id === selectedChildId)?.gender && (
                      <span className="capitalize">
                        Gender: {children.find(c => c.id === selectedChildId)?.gender}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/add-child"
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-all duration-300"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Link>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-all duration-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Child Selection */}
        {children.length > 1 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/30 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Child</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                    selectedChildId === child.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{child.name}</h3>
                      <p className="text-sm text-gray-600">{calculateAge(child.date_of_birth)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progress Overview for Selected Child */}
        {selectedChildId && progressData[selectedChildId] && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Assessments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {progressData[selectedChildId].totalAssessments}
                    </p>
                  </div>
                </div>
              </div>

              {progressData[selectedChildId].latestScore !== undefined && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Latest Score</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {progressData[selectedChildId].latestScore}/20
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {progressData[selectedChildId].latestRiskLevel && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Risk Level</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                        getRiskLevelColor(progressData[selectedChildId].latestRiskLevel!)
                      }`}>
                        {progressData[selectedChildId].latestRiskLevel?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {progressData[selectedChildId].scoreImprovement !== undefined && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      progressData[selectedChildId].scoreImprovement! >= 0
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}>
                      {progressData[selectedChildId].scoreImprovement! >= 0 ? (
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      ) : (
                        <TrendingUp className="h-6 w-6 text-red-600 rotate-180" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Score Change</p>
                      <p className={`text-2xl font-bold ${
                        progressData[selectedChildId].scoreImprovement! >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {progressData[selectedChildId].scoreImprovement! >= 0 ? '+' : ''}
                        {progressData[selectedChildId].scoreImprovement}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Last Assessment Info */}
            {progressData[selectedChildId].lastAssessmentDate && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Latest Assessment</h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-5 w-5" />
                      <span>
                        Completed on {format(new Date(progressData[selectedChildId].lastAssessmentDate!), 'MMMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/questionnaire"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <Plus className="h-5 w-5" />
                    New Assessment
                  </Link>
                </div>
              </div>
            )}

            {/* No Assessments State */}
            {progressData[selectedChildId].totalAssessments === 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center shadow-2xl border border-white/30">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No Assessments Yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Start tracking {children.find(c => c.id === selectedChildId)?.name}'s development by taking the first M-CHAT-R assessment.
                </p>
                <Link
                  href="/dashboard/questionnaire"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl inline-flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Plus className="h-5 w-5" />
                  Take First Assessment
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            href="/dashboard/add-child"
            className="bg-white/60 backdrop-blur-sm border border-gray-300 hover:bg-white/80 text-gray-700 px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5" />
            Add Another Child
          </Link>

          <Link
            href="/dashboard/questionnaire"
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            <FileText className="h-5 w-5" />
            Take Assessment
          </Link>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Delete {children.find(c => c.id === selectedChildId)?.name}'s Profile?
                </h3>

                <p className="text-gray-600 mb-6">
                  This will permanently delete all data including assessments, progress notes, and milestones.
                  This action cannot be undone.
                </p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-red-800 mb-2">The following data will be permanently deleted:</h4>
                  <ul className="text-sm text-red-700 space-y-1 text-left">
                    <li>• All assessment history and scores</li>
                    <li>• All progress notes and observations</li>
                    <li>• All developmental milestones</li>
                    <li>• All intervention records</li>
                    <li>• All saved progress data</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteLoading}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleDeleteChild}
                    disabled={deleteLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deleteLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete Profile
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
