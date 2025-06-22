'use client'

import { ScoringRange } from '@/types/assessment'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  score: number
}

export function ResultsCard({ score }: Props) {
  const router = useRouter()
  const [scoringRange, setScoringRange] = useState<ScoringRange | null>(null)


  useEffect(() => {
    const fetchScoringRange = async () => {
      const { data } = await supabase
        .from('scoring_ranges')
        .select('*')
        .lte('min_score', score)
        .gte('max_score', score)
        .single()

      if (data) {
        setScoringRange(data as ScoringRange)
      }
    }

    fetchScoringRange()
  }, [score, supabase])

  if (!scoringRange) return null

  return (
    <div className="card p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Assessment Results</h2>
      
      <div className="grid gap-4">
        <div>
          <p className="text-sm text-gray-500">Score</p>
          <p className="text-xl font-medium">{score} / 20 ({scoringRange.percentage_range})</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Risk Category</p>
          <p className="text-xl font-medium">{scoringRange.risk_category}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Interpretation</p>
          <p className="text-gray-700">{scoringRange.interpretation}</p>
        </div>

        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
