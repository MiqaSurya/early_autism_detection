'use client'

import { Question, Response } from '@/types/assessment'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  questions: Question[]
  assessmentId: string
  onComplete: (score: number) => void
}

export function QuestionForm({ questions, assessmentId, onComplete }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [responses, setResponses] = useState<Record<string, 'yes' | 'no'>>({})

  const { toast } = useToast()

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  const handleAnswer = async (answer: 'yes' | 'no') => {
    const updatedResponses = { ...responses, [currentQuestion.id]: answer }
    setResponses(updatedResponses)

    try {
      await supabase.from('responses').upsert({
        assessment_id: assessmentId,
        question_id: currentQuestion.id,
        answer
      })

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        const { data: assessment } = await supabase
          .from('assessments')
          .select('score')
          .eq('id', assessmentId)
          .single<{ score: number }>()

        if (assessment?.score !== null && assessment?.score !== undefined) {
          onComplete(assessment.score)
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save response. Please try again.'
      })
    }
  }

  return (
    <div className="space-y-8">
      <div className="h-2 bg-gray-200 rounded-full">
        <div
          className="h-2 bg-primary rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-medium mb-4">
          Question {currentIndex + 1} of {questions.length}
        </h3>
        <p className="text-lg mb-6">{currentQuestion.text}</p>
        
        <div className="flex gap-4">
          <Button
            onClick={() => handleAnswer('yes')}
            variant={responses[currentQuestion.id] === 'yes' ? 'default' : 'outline'}
            className="flex-1"
          >
            Yes
          </Button>
          <Button
            onClick={() => handleAnswer('no')}
            variant={responses[currentQuestion.id] === 'no' ? 'default' : 'outline'}
            className="flex-1"
          >
            No
          </Button>
        </div>
      </div>
    </div>
  )
}
