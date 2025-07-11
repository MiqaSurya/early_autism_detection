'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Question } from '@/types/questions'
import { calculateScore, getScoringRange } from '@/lib/scoring'
import { ResultsView } from './results-view'
import { getQuestionnaireQuestions, calculateRiskLevel, type QuestionnaireQuestion } from '@/lib/admin-db'
import { createAssessmentWithRetry, ensureTablesExist } from '@/lib/database-setup'

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

// Fallback questions if database is not available
function getFallbackQuestions(): QuestionnaireQuestion[] {
  const now = new Date().toISOString()
  return [
    { id: '1', questionNumber: 1, text: "If you point at something across the room, does your child look at it?", category: "social_communication", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '2', questionNumber: 2, text: "Have you ever wondered if your child is deaf?", category: "behavior_sensory", riskAnswer: "yes", isActive: true, createdAt: now, updatedAt: now },
    { id: '3', questionNumber: 3, text: "Does your child play pretend or make-believe?", category: "social_communication", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '4', questionNumber: 4, text: "Does your child like climbing on things?", category: "behavior_sensory", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '5', questionNumber: 5, text: "Does your child make unusual finger movements near his or her eyes?", category: "behavior_sensory", riskAnswer: "yes", isActive: true, createdAt: now, updatedAt: now },
    { id: '6', questionNumber: 6, text: "Does your child point with one finger to ask for something or to get help?", category: "social_communication", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '7', questionNumber: 7, text: "Does your child point with one finger to show you something interesting?", category: "social_communication", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '8', questionNumber: 8, text: "Is your child interested in other children?", category: "social_communication", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '9', questionNumber: 9, text: "Does your child show you things by bringing them to you or holding them up for you to see?", category: "social_communication", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '10', questionNumber: 10, text: "Does your child respond when you call his or her name?", category: "social_communication", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '11', questionNumber: 11, text: "When you smile at your child, does he or she smile back at you?", category: "social_communication", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '12', questionNumber: 12, text: "Does your child get upset by everyday noises?", category: "behavior_sensory", riskAnswer: "yes", isActive: true, createdAt: now, updatedAt: now },
    { id: '13', questionNumber: 13, text: "Does your child walk?", category: "behavior_sensory", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '14', questionNumber: 14, text: "Does your child look you in the eye when you are talking to him or her?", category: "social_communication", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '15', questionNumber: 15, text: "Does your child try to copy what you do?", category: "social_communication", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '16', questionNumber: 16, text: "If you turn your head to look at something, does your child look around to see what you are looking at?", category: "social_communication", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '17', questionNumber: 17, text: "Does your child try to get you to watch him or her?", category: "social_communication", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '18', questionNumber: 18, text: "Does your child understand when you tell him or her to do something?", category: "social_communication", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '19', questionNumber: 19, text: "If something new happens, does your child look at your face to see how you feel about it?", category: "social_communication", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now },
    { id: '20', questionNumber: 20, text: "Does your child like movement activities?", category: "behavior_sensory", riskAnswer: "no", isActive: true, createdAt: now, updatedAt: now }
  ]
}

export function QuestionnaireForm({ childId }: QuestionnaireFormProps) {
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no'>>({})
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)
  const [questionsLoading, setQuestionsLoading] = useState(true)

  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchQuestions = useCallback(async () => {
      setQuestionsLoading(true)
      try {
        const dbQuestions = await getQuestionnaireQuestions()
        console.log('Fetched questions from database:', dbQuestions)
        console.log('Questions structure:', dbQuestions.map(q => ({
          id: q.id,
          questionNumber: q.questionNumber,
          riskAnswer: q.riskAnswer,
          category: q.category,
          text: q.text.substring(0, 50) + '...'
        })))

        if (dbQuestions && dbQuestions.length > 0) {
          setQuestions(dbQuestions)
        } else {
          console.log('No questions from database, using fallback')
          // Use hardcoded fallback questions
          setQuestions(getFallbackQuestions())
        }
        setCurrentQuestion(0)
        setAnswers({})
      } catch (error) {
        console.error('Error fetching questions:', error)
        console.log('Using fallback questions due to error')
        // Fallback to hardcoded questions
        setQuestions(getFallbackQuestions())
        setCurrentQuestion(0)
        setAnswers({})
      }
      setQuestionsLoading(false)
    }, [])

  useEffect(() => {
    fetchQuestions()

    // Set up real-time subscription for question changes
    const subscription = supabase
      .channel('questionnaire-questions-user')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'questionnaire_questions' },
        () => {
          console.log('Questions updated, refreshing...')
          fetchQuestions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [fetchQuestions])

  // M-CHAT-R Scoring Algorithm using database questions
  const calculateMChatScore = () => {
    let riskScore = 0

    console.log('Calculating score with answers:', answers)
    console.log('Using questions:', questions.map(q => ({ id: q.id, riskAnswer: q.riskAnswer, text: q.text.substring(0, 50) + '...' })))

    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId)
      if (question) {
        // Check if the user's answer matches the risk answer for this question
        const userAnswerIsRisk = (question.riskAnswer === 'yes' && answer === 'yes') ||
                                (question.riskAnswer === 'no' && answer === 'no')

        console.log(`Question ${question.questionNumber}: User answered "${answer}", Risk answer is "${question.riskAnswer}", Is risk: ${userAnswerIsRisk}`)

        if (userAnswerIsRisk) {
          riskScore += 1
        }
      } else {
        console.warn(`Question not found for ID: ${questionId}`)
      }
    })

    console.log('Final risk score:', riskScore)
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
      console.log('=== SUBMITTING ASSESSMENT ===')
      console.log('Final answers before scoring:', answers)
      console.log('Total questions:', questions.length)
      console.log('Total answers:', Object.keys(answers).length)

      const score = calculateMChatScore()
      const riskAssessment = getMChatRiskLevel(score)

      console.log('Final calculated score:', score)
      console.log('Risk assessment:', riskAssessment)

      // Set the assessment result to display
      setAssessmentResult({
        score: score,
        riskLevel: riskAssessment.level as RiskLevel,
        interpretation: riskAssessment.action
      })

      // Save to database with child_id (only if childId is provided)
      if (childId) {
        console.log('Saving assessment to database...')
        console.log('Child ID:', childId)

        // Convert risk level to lowercase for database compatibility
        const dbRiskLevel = riskAssessment.level.toLowerCase().replace(' risk', '')
        console.log('DB Risk Level:', dbRiskLevel)

        const assessmentData = {
          child_id: childId,
          score: score,
          risk_level: dbRiskLevel,
          status: 'completed',
          completed_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          notes: riskAssessment.action,
          responses: answers  // Save the actual responses
        }

        console.log('Assessment data to save:', assessmentData)

        // Check if database tables exist first
        const tableCheck = await ensureTablesExist()
        if (!tableCheck.success) {
          console.error('Database tables not ready:', tableCheck.error)
          alert('Database setup required. Assessment results will be shown but not saved.')
        } else {
          // Try to save assessment with retry logic
          const saveResult = await createAssessmentWithRetry(assessmentData)

          if (!saveResult.success) {
            console.error('Failed to save assessment:', saveResult.error)
            alert('Failed to save assessment: ' + saveResult.error)
          } else {
            console.log('Assessment saved successfully:', saveResult.data)
            console.log('Assessment ID:', saveResult.data?.[0]?.id)
          }
        }
      } else {
        console.log('No child ID provided, skipping database save')
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

    const currentQ = questions[currentQuestion]
    console.log('Answering question:', currentQ.questionNumber, 'with:', answer)
    console.log('Question risk answer:', currentQ.riskAnswer)

    const newAnswers = { ...answers }
    // Clear answers for questions after the current one
    Object.keys(newAnswers).forEach(id => {
      const question = questions.find(q => q.id === id)
      if (question && questions.indexOf(question) > currentQuestion) {
        delete newAnswers[id]
      }
    })

    newAnswers[questions[currentQuestion].id] = answer
    setAnswers(newAnswers)

    console.log('Updated answers:', newAnswers)

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

  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Assessment</h2>
          <p className="text-gray-600">Preparing your M-CHAT-R questionnaire...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Questions Available</h2>
          <p className="text-gray-600 mb-4">The assessment questionnaire is currently being set up.</p>
          <p className="text-sm text-gray-500">Please contact support or try again later.</p>
        </div>
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
            {questions[currentQuestion].category === 'social_communication'
              ? '🔹 Social Communication & Interaction'
              : '🔹 Behavior & Sensory Reactions'}
          </span>
        </div>

        <h2 className="text-2xl font-semibold mb-8 text-center">
          {questions[currentQuestion].text}
        </h2>

        {/* Debug info - remove in production */}
        <div className="text-xs text-gray-500 text-center mb-4">
          Risk Answer: {questions[currentQuestion].riskAnswer} |
          Current Answers: {Object.keys(answers).length} |
          Question ID: {questions[currentQuestion].id}
        </div>

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
