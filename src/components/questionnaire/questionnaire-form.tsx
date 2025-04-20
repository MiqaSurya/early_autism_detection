'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// M-CHAT-R inspired questions
const questions = [
  {
    id: 1,
    text: "If you point at something across the room, does your child look at it?",
    description: "For example, if you point at a toy or an animal, does your child look at the toy or animal?"
  },
  {
    id: 2,
    text: "Does your child play pretend or make-believe?",
    description: "For example, pretend to drink from an empty cup, talk on a toy phone, or feed a doll?"
  },
  {
    id: 3,
    text: "Does your child like climbing on things?",
    description: "For example, furniture, playground equipment, or stairs"
  },
  {
    id: 4,
    text: "Does your child make unusual finger movements near their eyes?",
    description: "For example, wiggle their fingers close to their eyes?"
  },
  {
    id: 5,
    text: "Does your child point with one finger to ask for something or to get help?",
    description: "For example, pointing to a snack or toy that is out of reach"
  },
  // Add more questions as needed
]

export function QuestionnaireForm() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleAnswer = (answer: boolean) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: answer })
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Calculate risk level based on answers
      const riskFactors = Object.values(answers).filter(answer => answer).length
      let riskLevel = 'low'
      if (riskFactors >= 8) riskLevel = 'high'
      else if (riskFactors >= 4) riskLevel = 'medium'

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('User not found')

      const { error } = await supabase
        .from('questionnaire_responses')
        .insert([
          {
            user_id: user.id,
            answers,
            risk_level: riskLevel,
          }
        ])

      if (error) throw error

      router.push('/dashboard/questionnaire')
    } catch (error) {
      console.error('Error submitting questionnaire:', error)
      // TODO: Show error message to user
    } finally {
      setLoading(false)
    }
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="space-y-8">
      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="card">
        <p className="text-sm text-neutral-600 mb-2">
          Question {currentQuestion + 1} of {questions.length}
        </p>
        <h2 className="text-xl font-semibold mb-4">
          {questions[currentQuestion].text}
        </h2>
        <p className="text-neutral-600 mb-6">
          {questions[currentQuestion].description}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleAnswer(true)}
            disabled={loading}
            className="btn-secondary"
          >
            Yes
          </button>
          <button
            onClick={() => handleAnswer(false)}
            disabled={loading}
            className="btn-secondary"
          >
            No
          </button>
        </div>
      </div>

      {currentQuestion > 0 && (
        <button
          onClick={() => setCurrentQuestion(currentQuestion - 1)}
          disabled={loading}
          className="text-neutral-600 hover:text-neutral-900"
        >
          ← Previous Question
        </button>
      )}
    </div>
  )
}
