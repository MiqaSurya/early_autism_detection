'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'
import { BarChart3, Calendar, TrendingUp, TrendingDown, AlertCircle, Plus } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

type Assessment = {
  id: string
  score: number
  risk_level: string
  completed_at: string
  notes: string
}

interface AssessmentHistoryProps {
  childId: string
}

export function AssessmentHistory({ childId }: AssessmentHistoryProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    if (childId) {
      fetchAssessments()
    }
  }, [childId])

  const fetchAssessments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('assessments')
        .select('id, score, risk_level, completed_at, notes')
        .eq('child_id', childId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })

      if (error) throw error

      setAssessments(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch assessments'
      setError(errorMessage)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskLevelText = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'Low Risk'
      case 'medium':
        return 'Medium Risk'
      case 'high':
        return 'High Risk'
      default:
        return riskLevel
    }
  }

  const getScoreChange = (currentIndex: number) => {
    if (currentIndex >= assessments.length - 1) return null
    
    const current = assessments[currentIndex]
    const previous = assessments[currentIndex + 1]
    const change = current.score - previous.score
    
    return {
      change,
      isImprovement: change < 0, // Lower score is better in M-CHAT-R
      percentage: previous.score > 0 ? Math.abs((change / previous.score) * 100) : 0
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Assessment History</h2>
        <Link 
          href="/dashboard/questionnaire"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Assessment
        </Link>
      </div>

      {assessments.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assessments Yet</h3>
          <p className="text-gray-600 mb-6">
            Take your first M-CHAT-R assessment to start tracking development progress.
          </p>
          <Link 
            href="/dashboard/questionnaire"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Take First Assessment
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Total Assessments</p>
                  <p className="text-2xl font-bold text-blue-900">{assessments.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-600">Latest Score</p>
                  <p className="text-2xl font-bold text-green-900">{assessments[0]?.score || 0}/20</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-purple-600">Last Assessment</p>
                  <p className="text-lg font-bold text-purple-900">
                    {assessments[0] ? format(new Date(assessments[0].completed_at), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Assessment Timeline</h3>
            
            {assessments.map((assessment, index) => {
              const scoreChange = getScoreChange(index)
              
              return (
                <div key={assessment.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">M-CHAT-R Assessment</h4>
                        <p className="text-sm text-gray-600">
                          {format(new Date(assessment.completed_at), 'MMMM dd, yyyy \'at\' h:mm a')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {assessment.score}/20
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getRiskLevelColor(assessment.risk_level)}`}>
                        {getRiskLevelText(assessment.risk_level)}
                      </span>
                    </div>
                  </div>

                  {scoreChange && (
                    <div className="flex items-center gap-2 mb-3">
                      {scoreChange.isImprovement ? (
                        <TrendingDown className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        scoreChange.isImprovement ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {scoreChange.isImprovement ? 'Improved' : 'Increased'} by {Math.abs(scoreChange.change)} points
                        {scoreChange.percentage > 0 && ` (${scoreChange.percentage.toFixed(1)}%)`}
                      </span>
                    </div>
                  )}

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Recommended Action:</h5>
                    <p className="text-gray-700 text-sm">{assessment.notes}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
