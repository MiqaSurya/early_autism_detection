'use client'

import { useState, useEffect } from 'react'
import { Calculator, CheckCircle, AlertTriangle } from 'lucide-react'
import { getQuestionnaireQuestions, calculateRiskLevel, type QuestionnaireQuestion } from '@/lib/admin-db'

export default function TestScoringPage() {
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([])
  const [answers, setAnswers] = useState<{ [key: string]: 'yes' | 'no' }>({})
  const [score, setScore] = useState(0)
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const dbQuestions = await getQuestionnaireQuestions()
        setQuestions(dbQuestions)
        
        // Initialize all answers to 'no' for testing
        const initialAnswers: { [key: string]: 'yes' | 'no' } = {}
        dbQuestions.forEach(q => {
          initialAnswers[q.id] = 'no'
        })
        setAnswers(initialAnswers)
      } catch (error) {
        console.error('Error fetching questions:', error)
      }
      setLoading(false)
    }

    fetchQuestions()
  }, [])

  const calculateScore = async () => {
    try {
      const result = await calculateRiskLevel(answers)
      setScore(result.score)
      setRiskLevel(result.riskLevel)
    } catch (error) {
      console.error('Error calculating score:', error)
    }
  }

  useEffect(() => {
    if (questions.length > 0) {
      calculateScore()
    }
  }, [answers, questions])

  const handleAnswerChange = (questionId: string, answer: 'yes' | 'no') => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Loading...</h1>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Test Risk Scoring</h1>
        <p className="text-gray-600 mt-2">
          Test the risk calculation algorithm with different answer combinations
        </p>
      </div>

      {/* Score Display */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <Calculator className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Current Score</h2>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-3xl font-bold text-gray-900">{score}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(riskLevel)}`}>
                {riskLevel.toUpperCase()} RISK
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Scoring:</strong> 0-2 = Low Risk, 3-7 = Medium Risk, 8-20 = High Risk</p>
          <p><strong>Total Questions:</strong> {questions.length}</p>
        </div>
      </div>

      {/* Quick Test Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tests</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              const allNo: { [key: string]: 'yes' | 'no' } = {}
              questions.forEach(q => { allNo[q.id] = 'no' })
              setAnswers(allNo)
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            All "No" Answers
          </button>
          <button
            onClick={() => {
              const allYes: { [key: string]: 'yes' | 'no' } = {}
              questions.forEach(q => { allYes[q.id] = 'yes' })
              setAnswers(allYes)
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            All "Yes" Answers
          </button>
          <button
            onClick={() => {
              const mixed: { [key: string]: 'yes' | 'no' } = {}
              questions.forEach((q, index) => { 
                mixed[q.id] = index % 2 === 0 ? 'no' : 'yes' 
              })
              setAnswers(mixed)
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Mixed Answers
          </button>
          <button
            onClick={() => {
              const riskAnswers: { [key: string]: 'yes' | 'no' } = {}
              questions.forEach(q => { 
                riskAnswers[q.id] = q.riskAnswer 
              })
              setAnswers(riskAnswers)
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            All Risk Answers
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions & Answers</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {questions.map((question) => {
            const userAnswer = answers[question.id]
            const isRiskAnswer = userAnswer === question.riskAnswer
            
            return (
              <div key={question.id} className={`border rounded-lg p-4 ${isRiskAnswer ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start mb-3">
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
                      {isRiskAnswer && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          +1 RISK POINT
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{question.text}</p>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={userAnswer === 'yes'}
                      onChange={() => handleAnswerChange(question.id, 'yes')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={userAnswer === 'no'}
                      onChange={() => handleAnswerChange(question.id, 'no')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">No</span>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
