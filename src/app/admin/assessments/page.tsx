'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  FileText, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  RefreshCw,
  Eye,
  Save,
  X
} from 'lucide-react'
import {
  getAllAssessments,
  getAssessmentStats,
  updateAssessmentResult,
  deleteAssessment,
  getQuestionnaireQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
  calculateRiskLevel,
  type AdminAssessment,
  type AssessmentStats,
  type QuestionnaireQuestion
} from '@/lib/admin-db'
import { supabase } from '@/lib/supabase'

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<AdminAssessment[]>([])
  const [stats, setStats] = useState<AssessmentStats>({
    total: 0,
    completed: 0,
    inProgress: 0,
    lowRisk: 0,
    mediumRisk: 0,
    highRisk: 0
  })
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in_progress'>('all')
  const [filterRisk, setFilterRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [loading, setLoading] = useState(true)
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
  const [editingAssessment, setEditingAssessment] = useState<AdminAssessment | null>(null)
  const [showQuestionnaireModal, setShowQuestionnaireModal] = useState(false)

  const loadAssessmentData = useCallback(async () => {
    try {
      const [assessmentsData, statsData, questionsData] = await Promise.all([
        getAllAssessments(),
        getAssessmentStats(),
        getQuestionnaireQuestions()
      ])

      setAssessments(assessmentsData)
      setStats(statsData)
      setQuestions(questionsData)
    } catch (error) {
      console.error('Error loading assessment data:', error)
    }
  }, [])

  useEffect(() => {
    const initializeAssessments = async () => {
      setLoading(true)
      await loadAssessmentData()
      setLoading(false)
    }

    initializeAssessments()

    // Set up real-time subscriptions
    const subscriptions: any[] = []

    // Subscribe to assessments table changes
    const assessmentSubscription = supabase
      .channel('admin-assessments-page')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'assessments' },
        () => {
          console.log('Assessment data changed, refreshing...')
          loadAssessmentData()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealTimeConnected(true)
        }
      })

    subscriptions.push(assessmentSubscription)

    // Subscribe to children table changes
    const childrenSubscription = supabase
      .channel('admin-assessments-children')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'children' },
        () => {
          console.log('Children data changed, refreshing assessments...')
          loadAssessmentData()
        }
      )
      .subscribe()

    subscriptions.push(childrenSubscription)

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription)
      })
    }
  }, [loadAssessmentData])

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = 
      assessment.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assessment.parentEmail.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || assessment.status === filterStatus
    const matchesRisk = filterRisk === 'all' || assessment.riskLevel === filterRisk
    
    return matchesSearch && matchesStatus && matchesRisk
  })

  const handleUpdateAssessment = async (assessmentId: string, updates: any) => {
    try {
      const result = await updateAssessmentResult(assessmentId, updates)
      if (result.success) {
        await loadAssessmentData()
        setEditingAssessment(null)
      } else {
        alert('Failed to update assessment: ' + result.error)
      }
    } catch (error) {
      console.error('Error updating assessment:', error)
      alert('Failed to update assessment')
    }
  }

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      return
    }

    try {
      const result = await deleteAssessment(assessmentId)
      if (result.success) {
        await loadAssessmentData()
      } else {
        alert('Failed to delete assessment: ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting assessment:', error)
      alert('Failed to delete assessment')
    }
  }

  const getRiskBadgeColor = (riskLevel: string | null) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assessment Management</h1>
          <p className="text-gray-600 mt-2">
            Manage M-CHAT-R assessments and questionnaire settings
          </p>
        </div>

        {/* Loading Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-center">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <div className="h-6 w-6 bg-gray-300 rounded"></div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">Assessment Management</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isRealTimeConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-500">
                {isRealTimeConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            Manage M-CHAT-R assessments and questionnaire settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQuestionnaireModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span>Manage Questionnaire</span>
          </button>
          <button
            onClick={() => {
              setLoading(true)
              loadAssessmentData().finally(() => setLoading(false))
            }}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assessments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-gray-900">{stats.highRisk}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by child name or parent email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'completed' | 'in_progress')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
            </select>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value as 'all' | 'low' | 'medium' | 'high')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assessments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Child & Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAssessments.length > 0 ? (
                filteredAssessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{assessment.childName}</div>
                        <div className="text-sm text-gray-500">{assessment.parentEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(assessment.status)}`}>
                        {assessment.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assessment.riskLevel ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskBadgeColor(assessment.riskLevel)}`}>
                          {assessment.riskLevel} risk
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assessment.score !== null ? assessment.score : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(assessment.startedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assessment.completedAt ? new Date(assessment.completedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingAssessment(assessment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Assessment"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAssessment(assessment.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Assessment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">No assessments found</h3>
                      <p className="text-sm text-gray-500">
                        {searchTerm || filterStatus !== 'all' || filterRisk !== 'all'
                          ? 'Try adjusting your search or filter criteria.'
                          : 'No assessments have been started yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Assessment Modal */}
      {editingAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Assessment - {editingAssessment.childName}
                </h3>
                <button
                  onClick={() => setEditingAssessment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <EditAssessmentForm
                assessment={editingAssessment}
                questions={questions}
                onSave={handleUpdateAssessment}
                onCancel={() => setEditingAssessment(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Questionnaire Management Modal */}
      {showQuestionnaireModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  M-CHAT-R Questionnaire Management
                </h3>
                <button
                  onClick={() => setShowQuestionnaireModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <QuestionnaireManager
                questions={questions}
                onClose={() => setShowQuestionnaireModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Edit Assessment Form Component
function EditAssessmentForm({
  assessment,
  questions,
  onSave,
  onCancel
}: {
  assessment: AdminAssessment
  questions: QuestionnaireQuestion[]
  onSave: (id: string, updates: any) => void
  onCancel: () => void
}) {
  const [status, setStatus] = useState(assessment.status)
  const [riskLevel, setRiskLevel] = useState(assessment.riskLevel || 'low')
  const [score, setScore] = useState(assessment.score || 0)
  const [responses, setResponses] = useState(assessment.responses || {})

  const handleResponseChange = async (questionId: string, value: boolean) => {
    const newResponses = { ...responses, [questionId]: value }
    setResponses(newResponses)

    // Auto-calculate risk level and score using admin function
    try {
      const result = await calculateRiskLevel(newResponses)
      setRiskLevel(result.riskLevel)
      setScore(result.score)
    } catch (error) {
      console.error('Error calculating risk level:', error)
      // Fallback calculation
      let riskScore = 0
      Object.entries(newResponses).forEach(([qId, answer]) => {
        const question = questions.find(q => q.id === qId)
        if (question) {
          const userAnswerIsRisk = (question.riskAnswer === 'yes' && answer === true) ||
                                  (question.riskAnswer === 'no' && answer === false)
          if (userAnswerIsRisk) {
            riskScore += 1
          }
        }
      })
      setScore(riskScore)

      let newRiskLevel: 'low' | 'medium' | 'high'
      if (riskScore <= 2) {
        newRiskLevel = 'low'
      } else if (riskScore <= 7) {
        newRiskLevel = 'medium'
      } else {
        newRiskLevel = 'high'
      }
      setRiskLevel(newRiskLevel)
    }
  }

  const handleSave = () => {
    onSave(assessment.id, {
      status,
      riskLevel,
      score,
      responses
    })
  }

  return (
    <div className="space-y-6">
      {/* Assessment Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'in_progress' | 'completed')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value as 'low' | 'medium' | 'high')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Score</label>
        <input
          type="number"
          value={score}
          onChange={(e) => setScore(parseInt(e.target.value) || 0)}
          min="0"
          max="20"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Questions and Responses */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Assessment Responses</h4>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {questions.map((question) => (
            <div key={question.id} className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-900 mb-3">{question.questionNumber}. {question.text}</p>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={responses[question.id] === true}
                    onChange={() => handleResponseChange(question.id, true)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    checked={responses[question.id] === false}
                    onChange={() => handleResponseChange(question.id, false)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Risk answer: <span className="font-medium">{question.riskAnswer}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  )
}

// Questionnaire Manager Component
function QuestionnaireManager({
  questions,
  onClose
}: {
  questions: QuestionnaireQuestion[]
  onClose: () => void
}) {
  const [localQuestions, setLocalQuestions] = useState<QuestionnaireQuestion[]>(questions)
  const [editingQuestion, setEditingQuestion] = useState<QuestionnaireQuestion | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLocalQuestions(questions)
  }, [questions])

  const handleAddQuestion = async (questionData: {
    text: string
    category: 'social_communication' | 'behavior_sensory'
    riskAnswer: 'yes' | 'no'
  }) => {
    setLoading(true)
    try {
      const result = await addQuestion(questionData)
      if (result.success && result.question) {
        setLocalQuestions([...localQuestions, result.question])
        setShowAddForm(false)
        alert('Question added successfully!')
      } else {
        alert('Failed to add question: ' + result.error)
      }
    } catch (error) {
      console.error('Error adding question:', error)
      alert('Failed to add question')
    }
    setLoading(false)
  }

  const handleUpdateQuestion = async (questionId: string, updates: any) => {
    setLoading(true)
    try {
      const result = await updateQuestion(questionId, updates)
      if (result.success) {
        setLocalQuestions(localQuestions.map(q =>
          q.id === questionId ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q
        ))
        setEditingQuestion(null)
        alert('Question updated successfully!')
      } else {
        alert('Failed to update question: ' + result.error)
      }
    } catch (error) {
      console.error('Error updating question:', error)
      alert('Failed to update question')
    }
    setLoading(false)
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This will affect all future assessments.')) {
      return
    }

    setLoading(true)
    try {
      const result = await deleteQuestion(questionId)
      if (result.success) {
        setLocalQuestions(localQuestions.filter(q => q.id !== questionId))
        alert('Question deleted successfully!')
      } else {
        alert('Failed to delete question: ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Failed to delete question')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600">
        <p className="mb-2">
          The M-CHAT-R (Modified Checklist for Autism in Toddlers, Revised) is a validated screening tool
          for autism spectrum disorders in children aged 16-30 months.
        </p>
        <p>
          <strong>Scoring:</strong> Risk responses score 1 point each.
          0-2 points = Low Risk, 3-7 points = Medium Risk, 8-20 points = High Risk.
        </p>
        <p className="mt-2 text-amber-600">
          <strong>Note:</strong> Changes to questions will affect all future assessments and user questionnaires.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <h4 className="text-md font-medium text-gray-900">Current Questions ({localQuestions.length})</h4>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <span>Add New Question</span>
        </button>
      </div>

      {/* Add Question Form */}
      {showAddForm && (
        <AddQuestionForm
          onSave={handleAddQuestion}
          onCancel={() => setShowAddForm(false)}
          loading={loading}
        />
      )}

      {/* Questions List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {localQuestions.map((question) => (
          <div key={question.id} className="border border-gray-200 rounded-lg p-4">
            {editingQuestion?.id === question.id ? (
              <EditQuestionForm
                question={editingQuestion}
                onSave={handleUpdateQuestion}
                onCancel={() => setEditingQuestion(null)}
                loading={loading}
              />
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-900">Q{question.questionNumber}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      question.category === 'social_communication'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {question.category.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      question.riskAnswer === 'yes'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      Risk: {question.riskAnswer}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{question.text}</p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setEditingQuestion(question)}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                    title="Edit Question"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    title="Delete Question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// Add Question Form Component
function AddQuestionForm({
  onSave,
  onCancel,
  loading
}: {
  onSave: (data: { text: string; category: 'social_communication' | 'behavior_sensory'; riskAnswer: 'yes' | 'no' }) => void
  onCancel: () => void
  loading: boolean
}) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState<'social_communication' | 'behavior_sensory'>('social_communication')
  const [riskAnswer, setRiskAnswer] = useState<'yes' | 'no'>('no')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSave({ text: text.trim(), category, riskAnswer })
    }
  }

  return (
    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
      <h5 className="text-md font-medium text-gray-900 mb-4">Add New Question</h5>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the question text..."
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'social_communication' | 'behavior_sensory')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="social_communication">Social Communication</option>
              <option value="behavior_sensory">Behavior & Sensory</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Answer</label>
            <select
              value={riskAnswer}
              onChange={(e) => setRiskAnswer(e.target.value as 'yes' | 'no')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="no">No (indicates risk)</option>
              <option value="yes">Yes (indicates risk)</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-gray-600">
          <p><strong>Risk Answer:</strong> Select which answer (Yes or No) indicates autism risk for this question.</p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Question'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Edit Question Form Component
function EditQuestionForm({
  question,
  onSave,
  onCancel,
  loading
}: {
  question: QuestionnaireQuestion
  onSave: (id: string, updates: any) => void
  onCancel: () => void
  loading: boolean
}) {
  const [text, setText] = useState(question.text)
  const [category, setCategory] = useState(question.category)
  const [riskAnswer, setRiskAnswer] = useState(question.riskAnswer)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onSave(question.id, {
        text: text.trim(),
        category,
        riskAnswer
      })
    }
  }

  return (
    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
      <h5 className="text-md font-medium text-gray-900 mb-4">Edit Question {question.questionNumber}</h5>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as 'social_communication' | 'behavior_sensory')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="social_communication">Social Communication</option>
              <option value="behavior_sensory">Behavior & Sensory</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Answer</label>
            <select
              value={riskAnswer}
              onChange={(e) => setRiskAnswer(e.target.value as 'yes' | 'no')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="no">No (indicates risk)</option>
              <option value="yes">Yes (indicates risk)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
