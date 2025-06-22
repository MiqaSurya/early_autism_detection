'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Question, Assessment } from '@/types/assessment'
import { QuestionForm } from '@/components/assessment/question-form'
import { ResultsCard } from '@/components/assessment/results-card'
import { useToast } from '@/hooks/use-toast'

type AssessmentWithChild = Assessment & {
  children: {
    date_of_birth: string
  }
}

export default function AssessmentPage() {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const { id } = useParams()

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchAssessment = async () => {
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*, children(*)')
        .eq('id', id)
        .single()

      if (assessmentError || !assessmentData) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load assessment'
        })
        return
      }

      // Type guard function to validate assessment data
      const isValidAssessment = (data: unknown): data is AssessmentWithChild => {
        const d = data as any
        return (
          typeof d === 'object' &&
          d !== null &&
          'id' in d &&
          'child_id' in d &&
          'status' in d &&
          'started_at' in d &&
          'children' in d &&
          d.children !== null &&
          typeof d.children === 'object' &&
          'date_of_birth' in d.children &&
          typeof d.children.date_of_birth === 'string'
        )
      }

      // Validate assessment data
      if (!isValidAssessment(assessmentData)) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Invalid assessment data format'
        })
        return
      }

      setAssessment(assessmentData)

      // Fetch age-appropriate questions
      const childAge = new Date().getFullYear() - new Date(assessmentData.children.date_of_birth).getFullYear()
      const ageGroup = childAge <= 3 ? '0-3' : childAge <= 7 ? '4-7' : childAge <= 12 ? '8-12' : '13-18'

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('age_group', ageGroup)
        .order('order_number')

      if (questionsError) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load questions'
        })
        return
      }

      if (questionsData) {
        setQuestions(questionsData as Question[])
      }
    }

    fetchAssessment()
  }, [id, supabase, toast])

  const handleComplete = async (score: number) => {
    try {
      await supabase
        .from('assessments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          score
        })
        .eq('id', id)

      setAssessment(prev => prev ? { ...prev, status: 'completed', score } : null)
      
      toast({
        title: 'Assessment Complete',
        description: 'Your assessment has been submitted successfully.'
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete assessment'
      })
    }
  }

  if (!assessment || !questions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-8">Autism Screening Assessment</h1>
      
      {assessment.status === 'completed' && assessment.score !== undefined ? (
        <ResultsCard score={assessment.score} />
      ) : (
        <QuestionForm
          questions={questions}
          assessmentId={assessment.id}
          onComplete={handleComplete}
        />
      )}
    </div>
  )
}
