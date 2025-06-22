'use client'

import { Child } from '@/types/child'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

type Props = {
  child: Child
}

export function ChildCard({ child }: Props) {
  const router = useRouter()

  const { toast } = useToast()

  const startAssessment = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .insert({
          child_id: child.id,
          status: 'in_progress'
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/dashboard/assessment/${data.id}`)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start assessment'
      })
    }
  }

  const age = Math.floor(
    (new Date().getTime() - new Date(child.date_of_birth).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25)
  )

  const latestAssessment = child.assessments?.[0]

  return (
    <div className="card p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{child.name}</h3>
          <p className="text-gray-500">Age: {age} years</p>
        </div>
        <Button onClick={startAssessment}>
          Start New Assessment
        </Button>
      </div>

      {latestAssessment && (
        <div className="border-t pt-4 mt-4">
          <p className="text-sm text-gray-500">Latest Assessment</p>
          <div className="flex justify-between items-center mt-2">
            <div>
              <p className="font-medium">
                {latestAssessment.status === 'completed' ? 'Score: ' + latestAssessment.score + '/40' : 'In Progress'}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(latestAssessment.started_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/assessment/${latestAssessment.id}`)}
            >
              View Details
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
