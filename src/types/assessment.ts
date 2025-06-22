export type Question = {
  id: string
  category: string
  text: string
  age_group: '0-3' | '4-7' | '8-12' | '13-18'
  order_number: number
  is_reverse_scored: boolean
}

export type Response = {
  id: string
  assessment_id: string
  question_id: string
  answer: 'yes' | 'no'
  notes?: string
}

export type Assessment = {
  id: string
  child_id: string
  status: 'in_progress' | 'completed'
  started_at: string
  completed_at?: string
  score?: number
  notes?: string
}

export type ScoringRange = {
  min_score: number
  max_score: number
  percentage_range: string
  risk_category: string
  interpretation: string
}
