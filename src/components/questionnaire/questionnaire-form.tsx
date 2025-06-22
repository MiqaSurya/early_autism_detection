'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Question } from '@/types/questions'
import { calculateScore, getScoringRange } from '@/lib/scoring'
import { ResultsView } from './results-view'

// Define the AgeGroup type to include '0-12'
type AgeGroup = '0-12';

// M-CHAT-R Questions (Modified Checklist for Autism in Toddlers - Revised)
const LOCAL_QUESTIONS: Record<AgeGroup, Question[]> = {
  '0-12': [
    // Social Communication & Interaction
    { id: 1, text: 'If you point at something across the room, does your child look at it?', age_group: '0-12', is_reverse_scored: false },
    { id: 2, text: 'Have you ever wondered if your child might be deaf?', age_group: '0-12', is_reverse_scored: true },
    { id: 3, text: 'Does your child play pretend or make-believe? (e.g., pretend to drink from an empty cup)', age_group: '0-12', is_reverse_scored: false },
    { id: 4, text: 'Does your child point with one finger to ask for something or to get help?', age_group: '0-12', is_reverse_scored: false },
    { id: 5, text: 'Does your child point with one finger to show you something interesting?', age_group: '0-12', is_reverse_scored: true },
    { id: 6, text: 'Is your child interested in other children (e.g., watching them, smiling, approaching)?', age_group: '0-12', is_reverse_scored: false },
    { id: 7, text: 'Does your child show you things just to share (not to get help)?', age_group: '0-12', is_reverse_scored: false },
    { id: 8, text: 'Does your child respond when you call his or her name?', age_group: '0-12', is_reverse_scored: false },
    { id: 9, text: 'When you smile at your child, does he or she smile back?', age_group: '0-12', is_reverse_scored: false },
    { id: 10, text: 'Does your child look you in the eye during interactions?', age_group: '0-12', is_reverse_scored: false },
    { id: 11, text: 'Does your child try to copy what you do? (e.g., clapping, waving, funny sounds)', age_group: '0-12', is_reverse_scored: false },
    { id: 12, text: 'If you turn your head to look at something, does your child look in the same direction?', age_group: '0-12', is_reverse_scored: true },
    { id: 13, text: 'Does your child try to get you to watch them (e.g., says "look" or looks at you for praise)?', age_group: '0-12', is_reverse_scored: false },
    { id: 14, text: 'Does your child understand what you say without gestures? (e.g., "bring me the blanket")', age_group: '0-12', is_reverse_scored: false },
    { id: 15, text: 'If something unexpected happens, does your child look at your face to see your reaction?', age_group: '0-12', is_reverse_scored: false },
    // Behavior & Sensory Reactions
    { id: 16, text: 'Does your child get upset by everyday noises (e.g., vacuum cleaner, loud music)?', age_group: '0-12', is_reverse_scored: false },
    { id: 17, text: 'Does your child walk?', age_group: '0-12', is_reverse_scored: false },
    { id: 18, text: 'Does your child make unusual finger movements near their eyes (e.g., wiggling fingers)?', age_group: '0-12', is_reverse_scored: false },
    { id: 19, text: 'Does your child enjoy climbing on things (e.g., stairs, furniture)?', age_group: '0-12', is_reverse_scored: false },
    { id: 20, text: 'Does your child enjoy movement activities (e.g., being bounced or swung)?', age_group: '0-12', is_reverse_scored: false }
  ]
}

type RiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk'

type AssessmentResult = {
  score: number
  riskLevel: RiskLevel
  interpretation: string
}

interface QuestionnaireFormProps {
  childId?: string
}

export function QuestionnaireForm({ childId }: QuestionnaireFormProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, 'yes' | 'no'>>({})  
  const [loading, setLoading] = useState(false)
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('0-12');
  const [showResults, setShowResults] = useState(false)
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!ageGroup) return

      const questions = LOCAL_QUESTIONS[ageGroup] || []
      setQuestions(questions)
      setCurrentQuestion(0)
      setAnswers({})
    }

    fetchQuestions()
  }, [])

  // M-CHAT-R Scoring Algorithm
  const calculateMChatScore = () => {
    let riskScore = 0

    // Items 2, 5, 12 are risk if response is YES
    const riskIfYes = [2, 5, 12]
    // All other items are risk if response is NO

    Object.entries(answers).forEach(([questionId, answer]) => {
      const id = parseInt(questionId)

      if (riskIfYes.includes(id)) {
        // Risk if YES for items 2, 5, 12
        if (answer === 'yes') riskScore += 1
      } else {
        // Risk if NO for all other items
        if (answer === 'no') riskScore += 1
      }
    })

    return riskScore
  }

  const getMChatRiskLevel = (score: number): { level: string; action: string } => {
    if (score >= 0 && score <= 2) {
      return {
        level: 'Low Risk',
        action: 'No action needed (rescreen after 24 months if <24 months old)'
      }
    } else if (score >= 3 && score <= 7) {
      return {
        level: 'Medium Risk',
        action: 'Administer M-CHAT-R Follow-Up interview'
      }
    } else {
      return {
        level: 'High Risk',
        action: 'Immediate referral for autism evaluation and early intervention'
      }
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const score = calculateMChatScore()
      const riskAssessment = getMChatRiskLevel(score)

      // Set the assessment result to display
      setAssessmentResult({
        score: score,
        riskLevel: riskAssessment.level as RiskLevel,
        interpretation: riskAssessment.action
      })

      // Save to database with child_id (only if childId is provided)
      if (childId) {
        // Convert risk level to lowercase for database compatibility
        const dbRiskLevel = riskAssessment.level.toLowerCase().replace(' risk', '')

        const { data, error } = await supabase
          .from('assessments')
          .insert([
            {
              child_id: childId,
              score: score,
              risk_level: dbRiskLevel,
              notes: riskAssessment.action,
              status: 'completed',
              completed_at: new Date().toISOString()
            }
          ])

        if (error) console.error('Error saving assessment:', error)
      }

      // Show results
      setShowResults(true)
    } catch (error) {
      console.error('Error calculating results:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (answer: 'yes' | 'no') => {
    if (loading) return

    const newAnswers = { ...answers }
    Object.keys(newAnswers).forEach(id => {
      const questionId = parseInt(id)
      const question = questions.find(q => q.id === questionId)
      if (question && questions.indexOf(question) > currentQuestion) {
        delete newAnswers[questionId]
      }
    })

    newAnswers[questions[currentQuestion].id] = answer
    setAnswers(newAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      handleSubmit()
    }
  }

  if (showResults && assessmentResult) {
    return (
      <ResultsView
        score={assessmentResult.score}
        interpretation={assessmentResult.interpretation}
        riskLevel={assessmentResult.riskLevel}
        onClose={() => router.push('/dashboard/progress')}
      />
    )
  }

  if (questions.length === 0) {
    return (
      <div className="card">
        <p className="text-center text-neutral-600">
          Loading questions...
        </p>
      </div>
    )
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="absolute top-4 right-8 text-3xl font-bold text-blue-300">
        Question {currentQuestion + 1} of {questions.length}
      </div>

      <div className="text-center space-y-4 mb-8">
        <div className="text-3xl font-bold text-neutral-800">
          M-CHAT-R™ QUESTIONNAIRE
        </div>
        <div className="text-lg text-neutral-600">
          Modified Checklist for Autism in Toddlers - Revised
        </div>

        {currentQuestion === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left max-w-2xl mx-auto">
            <h3 className="font-semibold text-blue-800 mb-3">Instructions for parents/caregivers:</h3>
            <p className="text-blue-700">
              Answer <strong>YES</strong> if your child usually shows the described behavior.
              If your child does it only occasionally or not at all, answer <strong>NO</strong>.
            </p>
          </div>
        )}
      </div>

      <div className="bg-blue-200/80 rounded-3xl p-8 shadow-lg">
        {/* Category indicator */}
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {currentQuestion + 1 <= 15 ? '🔹 Social Communication & Interaction' : '🔹 Behavior & Sensory Reactions'}
          </span>
        </div>

        <h2 className="text-2xl font-semibold mb-8 text-center">
          {questions[currentQuestion].text}
        </h2>

        <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
          <button
            onClick={() => handleAnswer('yes')}
            disabled={loading}
            className="bg-blue-300 hover:bg-blue-400 text-neutral-800 font-semibold py-3 px-8 rounded-full text-lg uppercase transition-colors"
          >
            YES
          </button>
          <button
            onClick={() => handleAnswer('no')}
            disabled={loading}
            className="bg-blue-300 hover:bg-blue-400 text-neutral-800 font-semibold py-3 px-8 rounded-full text-lg uppercase transition-colors"
          >
            NO
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center max-w-md mx-auto">
        {currentQuestion > 0 ? (
          <button
            onClick={() => setCurrentQuestion(currentQuestion - 1)}
            disabled={loading}
            className="bg-blue-300 hover:bg-blue-400 text-neutral-800 font-semibold py-3 px-8 rounded-full text-lg uppercase transition-colors"
          >
            BACK
          </button>
        ) : (
          <div></div>
        )}
        {currentQuestion === questions.length - 1 && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-300 hover:bg-blue-400 text-neutral-800 font-semibold py-3 px-8 rounded-full text-lg uppercase transition-colors"
          >
            SUBMIT
          </button>
        )}
      </div>

      <div className="absolute top-0 left-0 right-0 h-2 bg-blue-100 dark:bg-blue-900">
        <div
          className="h-full bg-blue-300 dark:bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
